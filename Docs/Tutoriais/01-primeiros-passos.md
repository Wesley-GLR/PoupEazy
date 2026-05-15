# 🎓 Tutorial: Primeiros Passos com o PoupEazy

> **Objetivo:** Ao final deste tutorial, você terá o PoupEazy rodando localmente em sua máquina e estará pronto para explorar todas as funcionalidades.

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) versão **18 ou superior**
- [Git](https://git-scm.com/) para clonar o repositório
- Um editor de código (recomendamos [VS Code](https://code.visualstudio.com/))
- Uma conta no [Supabase](https://supabase.com/) (gratuita)

Para verificar se o Node.js está instalado corretamente:

```bash
node --version   # Deve exibir v18.x.x ou superior
npm --version    # Deve exibir 9.x.x ou superior
```

---

## Passo 1 — Clonar o repositório

Abra o terminal e execute:

```bash
git clone https://github.com/Wesley-GLR/PoupEazy.git
cd PoupEazy
```

Você verá a seguinte estrutura:

```
PoupEazy/
├── Docs/                  # Documentação (você está aqui!)
├── frontend/              # Aplicação React + Vite
├── poupeazy_supabase.sql  # Schema do banco de dados
├── PROXIMOS_PASSOS.md     # Roadmap de desenvolvimento
└── README.md              # Visão geral do projeto
```

---

## Passo 2 — Configurar o Supabase

### 2.1 Criar um projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com/) e faça login
2. Clique em **New Project**
3. Preencha:
   - **Name:** `PoupEazy`
   - **Database Password:** escolha uma senha forte (guarde-a!)
   - **Region:** selecione a mais próxima (ex: `South America (São Paulo)`)
4. Clique em **Create new project** e aguarde a inicialização

### 2.2 Executar o schema do banco

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `poupeazy_supabase.sql` da raiz do projeto
4. Cole no editor SQL e clique em **Run**
5. Você deve ver mensagens de sucesso para todas as tabelas, triggers e policies

### 2.3 Obter as credenciais

1. Vá em **Settings** → **API**
2. Copie os valores:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **anon public key** (começa com `eyJ...`)

---

## Passo 3 — Configurar variáveis de ambiente

Entre na pasta do frontend e crie o arquivo `.env`:

```bash
cd frontend
cp .env.example .env
```

Edite o arquivo `.env` com as credenciais obtidas no passo anterior:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> ⚠️ **Importante:** Nunca commite o arquivo `.env` no repositório. Ele já está incluído no `.gitignore`.

---

## Passo 4 — Instalar dependências

Ainda dentro da pasta `frontend/`, execute:

```bash
npm install
```

Este comando instalará todas as dependências listadas no `package.json`, incluindo:

- **React 18** + **TypeScript** — Framework e tipagem
- **Vite** — Bundler e dev server
- **Tailwind CSS v4** — Estilização
- **React Router v7** — Roteamento
- **Recharts** — Gráficos
- **Lucide React** — Ícones
- **@supabase/supabase-js** — Cliente Supabase

---

## Passo 5 — Rodar o projeto

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O terminal exibirá algo como:

```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Abra o navegador em **http://localhost:5173/** e você verá a tela de login do PoupEazy! 🎉

---

## Passo 6 — Criar sua primeira conta

1. Na tela de login, clique em **Cadastre-se**
2. Preencha:
   - **Nome completo**
   - **E-mail** (pode ser qualquer e-mail válido)
   - **Senha** (mínimo 6 caracteres)
3. Clique em **Criar conta**
4. Dependendo da configuração do Supabase, pode ser necessário confirmar o e-mail

Após o login, você será redirecionado ao **Dashboard** — o painel principal do PoupEazy.

---

## Próximos passos

Agora que o ambiente está configurado, siga para:

- 📝 [Tutorial: Primeira Transação](./02-primeira-transacao.md) — Aprenda a registrar receitas e despesas
- 🎯 [Tutorial: Criando Metas Financeiras](./03-criando-metas.md) — Defina e acompanhe seus objetivos

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| `npm install` falha | Verifique a versão do Node.js com `node -v` (precisa ser ≥ 18) |
| Tela branca ao abrir o app | Verifique se o `.env` está correto e reinicie o `npm run dev` |
| Erro de autenticação | Confirme as credenciais do Supabase (URL e anon key) |
| Tabelas não encontradas | Execute novamente o script SQL no Supabase SQL Editor |
