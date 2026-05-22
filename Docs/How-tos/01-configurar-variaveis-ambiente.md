# 🔧 How-to: Configurar Variáveis de Ambiente

> Guia rápido para configurar as variáveis de ambiente necessárias para o PoupEazy.

---

## Variáveis necessárias

O PoupEazy requer **duas** variáveis de ambiente para funcionar:

| Variável | Descrição | Onde encontrar |
|----------|-----------|----------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anônima | Supabase Dashboard → Settings → API → anon public |

---

## Configuração Local

### 1. Criar o arquivo `.env`

```bash
cd frontend
cp .env.example .env
```

### 2. Editar com suas credenciais

```env
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Reiniciar o dev server

Se o servidor já estiver rodando, pare (`Ctrl+C`) e reinicie:

```bash
npm run dev
```

> ⚠️ O Vite **não** recarrega automaticamente ao alterar o `.env`. É necessário reiniciar.

---

## Configuração para Deploy (Vercel)

1. Acesse o painel da Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:
   - `VITE_SUPABASE_URL` → valor da URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` → valor da anon key
4. Clique em **Save**
5. Faça um **Redeploy** para que as variáveis entrem em vigor

---

## Segurança

- O arquivo `.env` está no `.gitignore` e **não deve ser commitado**
- A `anon key` é segura para uso no frontend — o Supabase a utiliza em combinação com RLS (Row Level Security) para proteger os dados
- **Nunca** exponha a `service_role key` no frontend — ela ignora as políticas RLS

---

## Verificação

Para confirmar que as variáveis estão configuradas corretamente:

1. Abra o console do navegador (`F12` → Console)
2. Tente fazer login com um usuário existente
3. Se houver erro de rede, verifique:
   - A URL está correta e acessível
   - A anon key é válida
   - O projeto Supabase está ativo (não pausado)
