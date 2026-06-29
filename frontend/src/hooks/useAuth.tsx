import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setToken, clearToken, getToken, ApiError } from '../lib/api'
import type { Profile } from '../types/database'

// Usuario autenticado (campos retornados pelo backend proprio).
export interface AuthUser {
  id: string
  email: string
  criado_em?: string
}

interface AuthResponse {
  token: string
  user: AuthUser
  profile: Profile | null
}

// Contexto global de autenticacao:
// centraliza usuario, perfil e acoes de login/cadastro/logout usando JWT no localStorage.
interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, nome: string, telefone?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Recupera a sessao a partir do token salvo no navegador.
    async function restore() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const data = await api.get<{ user: AuthUser; profile: Profile | null }>('/auth/me')
        setUser(data.user)
        setProfile(data.profile)
      } catch {
        // Token invalido/expirado: limpa estado.
        clearToken()
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  // Login por e-mail/senha: guarda o JWT e popula usuario + perfil.
  async function signIn(email: string, password: string) {
    try {
      const data = await api.post<AuthResponse>('/auth/login', { email, password }, { auth: false })
      setToken(data.token)
      setUser(data.user)
      setProfile(data.profile)
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Cadastro: cria a conta no backend. Nao autentica automaticamente
  // (a tela de cadastro redireciona para o login, mantendo o fluxo original).
  async function signUp(email: string, password: string, nome: string, telefone?: string) {
    try {
      await api.post<AuthResponse>(
        '/auth/register',
        { email, password, nome, telefone: telefone || null },
        { auth: false }
      )
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Logout: descarta o token e limpa o estado local.
  async function signOut() {
    clearToken()
    setUser(null)
    setProfile(null)
  }

  // Atualiza o profile e re-sincroniza o estado local.
  async function updateProfile(data: Partial<Profile>) {
    if (!user) return
    const updated = await api.patch<Profile>('/profile', data)
    setProfile(updated)
  }

  // Solicita recuperacao de senha. Em desenvolvimento o backend retorna o resetToken
  // no corpo da resposta (para testar via Postman, sem servidor de e-mail).
  async function resetPassword(email: string) {
    try {
      await api.post('/auth/forgot-password', { email }, { auth: false })
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  // Troca de senha do usuario autenticado.
  async function updatePassword(newPassword: string) {
    try {
      await api.patch('/auth/password', { novaSenha: newPassword })
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook de acesso seguro ao contexto.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}

// Re-exporta o ApiError para quem precisar inspecionar status HTTP.
export { ApiError }
