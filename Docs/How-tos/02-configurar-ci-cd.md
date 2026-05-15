# 🔧 How-to: Configurar CI/CD no GitHub Actions

> Guia para configurar uma esteira de integração contínua e deploy contínuo para o PoupEazy usando GitHub Actions.

---

## Visão Geral

A esteira CI/CD automatiza:

1. **CI (Integração Contínua):** Verificação de tipos TypeScript, lint e build a cada push/PR
2. **CD (Deploy Contínuo):** Deploy automático na Vercel após merge na `main`

---

## Passo 1 — Criar o workflow de CI

Crie o arquivo `.github/workflows/ci.yml` na raiz do repositório:

```yaml
name: CI — PoupEazy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    name: Lint, Type Check & Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - name: Checkout do código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Instalar dependências
        run: npm ci

      - name: Verificação de tipos (TypeScript)
        run: npx tsc --noEmit

      - name: Build de produção
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

---

## Passo 2 — Configurar Secrets no GitHub

1. Vá no repositório do GitHub
2. Acesse **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret** e adicione:

   | Nome do Secret | Valor |
   |----------------|-------|
   | `VITE_SUPABASE_URL` | URL do projeto Supabase |
   | `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase |

---

## Passo 3 — Configurar Deploy Automático (Vercel)

### Opção A — Via integração Vercel + GitHub (Recomendado)

1. Acesse [vercel.com](https://vercel.com/) e conecte seu repositório GitHub
2. Na configuração do projeto:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Adicione as variáveis de ambiente no painel da Vercel
4. A cada push na `main`, a Vercel faz deploy automaticamente

### Opção B — Via GitHub Actions

Adicione ao workflow de CI:

```yaml
  deploy:
    name: Deploy na Vercel
    runs-on: ubuntu-latest
    needs: lint-and-build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout do código
        uses: actions/checkout@v4

      - name: Deploy via Vercel CLI
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: "--prod"
```

Adicione os secrets adicionais:

| Secret | Como obter |
|--------|-----------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Arquivo `.vercel/project.json` (após `vercel link`) |
| `VERCEL_PROJECT_ID` | Arquivo `.vercel/project.json` (após `vercel link`) |

---

## Passo 4 — Configurar proteção de branches

Para garantir que o CI passe antes de fazer merge:

1. No GitHub, vá em **Settings** → **Branches**
2. Clique em **Add rule** para a branch `main`
3. Marque:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - Selecione o check `lint-and-build`
4. Salve a regra

---

## Verificação

Após configurar:

1. Crie uma branch de teste: `git checkout -b test/ci-pipeline`
2. Faça um commit qualquer e push: `git push origin test/ci-pipeline`
3. Abra um Pull Request para `main`
4. Verifique se o workflow aparece na aba **Actions** do GitHub
5. Confirme que os checks passaram no PR

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `npm ci` falha | Certifique-se de que `package-lock.json` está commitado |
| `tsc` falha | Corrija os erros de tipo antes de fazer push |
| Build falha | Verifique se os secrets de ambiente estão configurados |
| Deploy não dispara | Confirme que o push foi na branch `main` |
