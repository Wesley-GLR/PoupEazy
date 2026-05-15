# 📖 Referência: Variáveis de Ambiente

> Lista completa de variáveis de ambiente utilizadas no PoupEazy.

---

## Variáveis do Frontend

| Variável | Obrigatória | Descrição | Exemplo |
|----------|:-----------:|-----------|---------|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave pública anônima do Supabase | `eyJhbGciOiJIUzI1NiIs...` |

---

## Onde Configurar

| Ambiente | Método |
|----------|--------|
| **Local** | Arquivo `frontend/.env` (copiado de `.env.example`) |
| **Vercel** | Settings → Environment Variables |
| **GitHub Actions** | Settings → Secrets and variables → Actions |

---

## Arquivo `.env.example`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Segurança

- `.env` está no `.gitignore` — **nunca** commitar
- A `anon key` é segura no frontend (protegida por RLS)
- A `service_role key` **nunca** deve ser exposta no frontend
- No Supabase Dashboard: Settings → API para obter as chaves

---

## Prefixo `VITE_`

Variáveis de ambiente no Vite **devem** ter o prefixo `VITE_` para serem acessíveis no código do frontend via `import.meta.env.VITE_*`. Variáveis sem este prefixo não são expostas ao navegador.
