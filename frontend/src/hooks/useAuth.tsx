import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

/**
 * Contrato de tipagem para o Contexto Global de Autenticação.
 * Centraliza o acesso aos dados da sessão, o perfil do usuário e expõe 
 * as funções de mutação para login, cadastro, logout e recuperação de senha.
 */
interface AuthContextType {
  user: User | null
  session: Session | null
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

/**
 * Provedor Global de Autenticação (Context API).
 * * Envolve a árvore de componentes da aplicação para fornecer o estado de autenticação
 * em tempo real. Gerencia a persistência da sessão no navegador e escuta ativamente 
 * as mudanças de estado do Supabase (login, logout, token refresh).
 * * @param props - Propriedades do componente.
 * @param props.children - A árvore de componentes filhos que terá acesso ao contexto.
 * @returns O componente provedor com o contexto preenchido.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Busca os dados complementares do usuário armazenados na tabela `profiles`.
   * * @param userId - O identificador único do usuário (gerado pelo Supabase Auth).
   */
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

  /**
   * Autentica um usuário existente utilizando e-mail e senha.
   * * @param email - O endereço de e-mail registrado.
   * @param password - A senha da conta.
   * @returns Objeto contendo o erro retornado pelo provedor, se houver.
   */
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  /**
   * Registra um novo usuário no sistema.
   * Passa os metadados (nome, telefone) no payload `options.data` para que o Supabase
   * acione as triggers internas e crie automaticamente o registro na tabela `profiles`.
   * * @param email - E-mail para cadastro.
   * @param password - Senha escolhida.
   * @param nome - Nome completo do usuário.
   * @param telefone - (Opcional) Telefone para contato.
   * @returns Objeto contendo o erro retornado pelo provedor, se houver.
   */
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

  /**
   * Encerra a sessão ativa do usuário.
   * Limpa explicitamente o estado local do profile para evitar o vazamento de 
   * dados "fantasma" na interface caso outro usuário faça login em seguida.
   */
  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  /**
   * Atualiza as informações personalizadas do usuário na tabela `profiles`.
   * Realiza uma nova busca logo após a atualização para manter o estado da UI 
   * perfeitamente sincronizado com o banco.
   * * @param data - Objeto contendo os campos do perfil a serem alterados.
   */
  async function updateProfile(data: Partial<Profile>) {
    if (!user) return
    await supabase.from('profiles').update(data as Record<string, unknown>).eq('id', user.id)
    await fetchProfile(user.id)
  }

  
  /**
   * Solicita ao Supabase o envio de um e-mail com link de recuperação de senha.
   * É obrigatório que a URL informada no `redirectTo` esteja autorizada nas
   * configurações de Authentication → URL Configuration do projeto no Supabase.
   * * @param email - O e-mail da conta que deseja recuperar o acesso.
   * @returns Objeto contendo o erro retornado pelo provedor, se houver.
   */
  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    return { error: error as Error | null }
  }

  /**
   * Atualiza a credencial de senha do usuário.
   * Geralmente acionado quando o usuário clica no link de redefinição de senha
   * e o Supabase estabelece uma sessão temporária via evento `PASSWORD_RECOVERY`.
   * * @param newPassword - A nova senha definida pelo usuário.
   * @returns Objeto contendo o erro retornado pelo provedor, se houver.
   */
  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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

/**
 * Hook customizado para acesso seguro ao Contexto de Autenticação.
 * * @throws Lança um erro fatal se for invocado por um componente que não esteja encapsulado pelo `AuthProvider`.
 * @returns O objeto contendo as propriedades e métodos globais de autenticação (`AuthContextType`).
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
