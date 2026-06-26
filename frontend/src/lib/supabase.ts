import { createClient } from '@supabase/supabase-js'

// Credenciais públicas do cliente Supabase usadas pelo frontend.
// Se estiverem ausentes, a aplicação não consegue autenticar nem consultar dados.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env')
}

/**
 * Instância global do cliente Supabase.
 * * É a "ponte" de comunicação oficial entre o frontend e o backend (banco de dados e autenticação).
 * Inicializada a partir das variáveis de ambiente expostas pelo Vite. O módulo valida a presença 
 * das credenciais essenciais no arquivo `.env` em tempo de execução e aplica a técnica de "fail-fast", 
 * paralisando a aplicação com um erro claro caso a configuração esteja incompleta.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
