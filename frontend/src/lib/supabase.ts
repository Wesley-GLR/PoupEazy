import { createClient } from '@supabase/supabase-js'

// Credenciais públicas do cliente Supabase usadas pelo frontend.
// Se estiverem ausentes, a aplicação não consegue autenticar nem consultar dados.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
