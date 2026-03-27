# PoupEazy - Gestão Financeira Pessoal

Sistema web de gerenciamento financeiro pessoal desenvolvido como projeto acadêmico para a disciplina de **Análise e Desenvolvimento de Software III** na **UNIFEI - Campus Itabira**.

O PoupEazy ajuda usuários a controlar gastos, definir metas financeiras e acompanhar orçamentos mensais de forma intuitiva e automatizada.

---

## Funcionalidades

- **Autenticação** — Cadastro e login via Supabase Auth (e-mail/senha)
- **Painel (Dashboard)** — Visão geral com cards de receita, despesa, saldo e orçamento; transações recentes; gráfico de despesas por categoria
- **Transações** — CRUD completo de receitas e despesas com filtros por tipo e busca textual; associação automática ao orçamento do mês
- **Categorias** — Categorias do sistema (protegidas) e categorias personalizadas do usuário; gráfico pizza de distribuição de gastos
- **Metas Financeiras** — Criação de metas com valor objetivo, prazo e barra de progresso; status ativa/concluída/cancelada
- **Orçamentos Mensais** — Planejamento de gastos por mês com comparativo planejado vs real; gráfico de barras anual
- **Notificações** — Tabela preparada para alertas de limite excedido, metas próximas e dicas financeiras (RF07)
- **Open Finance** — Estrutura de banco pronta para integração futura com bancos via OAuth 2.0 (RF04)
- **ChatBot WhatsApp** — Campo `origem` nas transações preparado para registro via chatbot (RF02)

---

## Tecnologias

| Camada     | Tecnologia                        |
| ---------- | --------------------------------- |
| Frontend   | React 18 + TypeScript             |
| Build      | Vite                              |
| Estilização | Tailwind CSS v4                  |
| Roteamento | React Router v7                   |
| Gráficos   | Recharts                          |
| Ícones     | Lucide React                      |
| Backend    | Supabase (Auth + PostgreSQL + RLS)|
| Banco      | PostgreSQL 15+                    |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- Conta no [Supabase](https://supabase.com/) (projeto já criado)

---

## Como rodar localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/PoupEazy.git
cd PoupEazy
```

### 2. Configurar variáveis de ambiente

```bash
cd frontend
cp .env.example .env
```

Edite o `.env` com as credenciais do seu projeto Supabase:

```
VITE_SUPABASE_URL= Link do seu projeto no supabase
VITE_SUPABASE_ANON_KEY= Sua anon key
```

### 3. Instalar dependências e rodar

```bash
npm install
npm run dev
```

O app estará disponível no link localmente.
O app está disponível em versão estável em: https://poup-eazy.vercel.app/

---

## Estrutura do Projeto

```

## Fluxo técnico da aplicação

1. Usuário acessa o frontend React e passa pelo roteamento em `App.tsx`.
2. `AuthProvider` valida sessão com Supabase Auth e disponibiliza `user/profile`.
3. As páginas consomem hooks (`useTransactions`, `useBudget`, `useGoals`, `useCategories`) para ler/escrever dados no banco.
4. O Supabase aplica regras de segurança (RLS), garantindo acesso somente aos dados do usuário autenticado.
5. Triggers no banco recalculam automaticamente valores derivados (como `orcamento.valor_real` e `metas.valor_atual`).

### Como navegar no código sem se perder

- Comece por `frontend/src/main.tsx` e `frontend/src/App.tsx` para entender bootstrap e rotas.
- Em seguida leia `frontend/src/hooks` para entender as regras de negócio e acesso ao Supabase.
- Depois veja `frontend/src/pages` para entender como os dados chegam na interface.
- Use `frontend/src/types/database.ts` como contrato oficial de dados entre UI e banco.

PoupEazy/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, AuthLayout, AppLayout
│   │   │   ├── ui/                # Card, ProgressBar, Modal
│   │   │   └── charts/            # PieChart, BarChart (Recharts)
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── Goals.tsx
│   │   │   └── Budget.tsx
│   │   ├── hooks/                 # useAuth, useTransactions, etc.
│   │   ├── lib/                   # Supabase client, formatters
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── App.tsx                # Rotas e providers
│   │   └── main.tsx               # Entry point
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
```

---

## Requisitos Implementados

| Código | Descrição                             | Status           |
| ------ | ------------------------------------- | ---------------- |
| RF01   | Gerenciar usuários                    | Implementado     |
| RF02   | ChatBot WhatsApp                      | Estrutura pronta |
| RF03   | Metas e gastos                        | Implementado     |
| RF04   | Integração Open Finance               | Estrutura pronta |
| RF05   | Categorização automática              | Parcial          |
| RF06   | Relatórios financeiros                | Implementado     |
| RF07   | Notificações e alertas                | Estrutura pronta |
| RF08   | Orçamentos mensais                    | Implementado     |
| RNF01  | Interface intuitiva                   | Implementado     |
| RNF02  | Proteção de dados (RLS)               | Implementado     |
| RNF04  | Suportar diversos navegadores         | Implementado     |

---

## Equipe

| Nome                              | Função          |
| --------------------------------- | --------------- |
| Brendow Scarabelli Silveira       | Desenvolvedor   |
| Heitor Martins Colombino          | Desenvolvedor   |
| Matheus Idjarurir Santos Miranda  | Desenvolvedor   |
| Pedro Mello Morais                | Desenvolvedor   |
| Matheus de Oliveira Barbosa       | Desenvolvedor   |
| Wesley Gabriel Lima Rabelo        | Desenvolvedor   |
| Vitor Hugo Peluchi Nascimento     | Desenvolvedor   |
| Kleber Augusto Barbosa            | Desenvolvedor   |

**Instituição:** UNIFEI - Universidade Federal de Itajubá, Campus Itabira

---

## Licença

Projeto acadêmico. Todos os direitos reservados aos autores.
