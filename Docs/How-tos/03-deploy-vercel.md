# 🔧 How-to: Deploy na Vercel

> Guia para realizar o deploy do PoupEazy na Vercel, seja manualmente ou via integração automática.

---

## Pré-requisitos

- Conta na [Vercel](https://vercel.com/) (gratuita)
- Repositório do PoupEazy no GitHub
- Credenciais do Supabase (URL e anon key)

---

## Deploy via Interface Web (Recomendado para Primeiro Deploy)

### 1. Importar o projeto

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte sua conta GitHub (se ainda não estiver conectada)
3. Selecione o repositório **Wesley-GLR/PoupEazy**
4. Clique em **Import**

### 2. Configurar o projeto

Na tela de configuração, defina:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 3. Adicionar variáveis de ambiente

Na seção **Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (sua anon key) |

### 4. Deploy

Clique em **Deploy** e aguarde o build. Em ~1-2 minutos, o app estará disponível em:

```
https://poup-eazy.vercel.app/
```

---

## Deploy via CLI

### 1. Instalar a Vercel CLI

```bash
npm install -g vercel
```

### 2. Linkar o projeto

```bash
cd frontend
vercel link
```

Siga as instruções para conectar ao projeto na Vercel.

### 3. Deploy de preview

```bash
vercel
```

### 4. Deploy em produção

```bash
vercel --prod
```

---

## Configurar Domínio Personalizado

1. Na Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio (ex: `poupeazy.com.br`)
3. Configure os registros DNS conforme instruído:
   - **CNAME:** `cname.vercel-dns.com`
   - ou **A:** `76.76.21.21`

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha com "module not found" | Verifique se `Root Directory` está como `frontend` |
| Página em branco após deploy | Confirme as variáveis de ambiente na Vercel |
| Erro 404 nas rotas | Adicione `vercel.json` com rewrites (veja abaixo) |

### Configurar rewrites para SPA

Crie `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Isso garante que todas as rotas do React Router funcionem corretamente em produção.
