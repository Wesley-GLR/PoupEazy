import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

// Contexto global de autenticação:
// centraliza sessão, perfil e ações de login/cadastro/logout.
interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, nome: string, telefone?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Carrega dados complementares do usuário na tabela `profiles`.
  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    // 1) Recupera sessão já persistida no navegador.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id)
      setLoading(false)
    })

    // 2) Escuta mudanças de autenticação (login, logout, refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) fetchProfile(s.user.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Login por e-mail/senha.
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  // Cadastro: os metadados viram base para criação automática do profile no banco.
  async function signUp(email: string, password: string, nome: string, telefone?: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, telefone: telefone || null },
      },
    })
    return { error: error as Error | null }
  }

  // Logout também limpa estado local de profile para evitar dados "fantasma" na UI.
  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  // Atualização explícita de profile com recarga posterior para manter UI sincronizada.
  async function updateProfile(data: Partial<Profile>) {
    if (!user) return
    await supabase.from('profiles').update(data as Record<string, unknown>).eq('id', user.id)
    await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, updateProfile }}>
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
