# PoupEazy - Gestão Financeira Pessoal

Sistema web de gerenciamento financeiro pessoal desenvolvido como projeto acadêmico para a disciplina de **Análise e Desenvolvimento de Software III** na **UNIFEI - Campus Itabira**.

O PoupEazy ajuda usuários a controlar gastos, definir metas financeiras e acompanhar orçamentos mensais de forma intuitiva e automatizada.

---

## Funcionalidades

- **Autenticação** — Cadastro e login via backend próprio com JWT (e-mail/senha)
- **Painel (Dashboard)** — Visão geral com cards de receita, despesa, saldo e orçamento; transações recentes; gráfico de despesas por categoria
- **Transações** — CRUD completo de receitas e despesas com filtros por tipo e busca textual; associação automática ao orçamento do mês
- **Categorias** — Categorias do sistema (protegidas) e categorias personalizadas do usuário; gráfico pizza de distribuição de gastos
- **Metas Financeiras** — Criação de metas com valor objetivo, prazo e barra de progresso; status ativa/concluída/cancelada
- **Orçamentos Mensais** — Planejamento de gastos por mês com comparativo planejado vs real; gráfico de barras anual
- **Notificações** — Tabela preparada para alertas de limite excedido, metas próximas e dicas financeiras (RF07)
- **Open Finance** — Estrutura de banco pronta para integração futura com bancos via OAuth 2.0 (RF04)
- **Chatbot WhatsApp** — Vínculo da conta, registro de despesas com confirmação e consulta de relatórios pelo WhatsApp (RF02)

---

## Registrar via WhatsApp

1. Na demonstração com Vonage, inscreva seu número pelo link de adesão do Sandbox enviado pela equipe.
2. Entre na sua conta PoupEazy e abra **Transações → Registrar via WhatsApp → Gerar link de vínculo**. Abra o WhatsApp e envie a mensagem preenchida. Volte ao PoupEazy e selecione **Já enviei a mensagem**.
3. Envie `cabelo 35` no WhatsApp e responda `sim` para confirmar. Atualize **Transações** para ver o lançamento identificado como **WhatsApp**.
4. Envie `relatório diário`, `relatório semanal`, `relatório mensal` ou `relatório total` para consultar sua conta. O bot pode enviar um gráfico em PNG quando o backend está configurado com Vonage e mídia HTTPS.

O vínculo é compartilhado entre o site e o aplicativo para a mesma conta. O recurso depende da API estar configurada e habilitada. Consulte o [guia de configuração do backend](https://github.com/Wesley-GLR/PoupEazy_BackEnd/blob/main/WHATSAPP_DEMO.md).

---

## Tecnologias

| Camada      | Tecnologia                           |
| ----------- | ------------------------------------ |
| Frontend    | React 19 + TypeScript                |
| Build       | Vite                                 |
| Estilização | Tailwind CSS v4                      |
| Roteamento  | React Router v7                      |
| Gráficos    | Recharts                             |
| Ícones      | Lucide React                         |
| Backend     | Node.js + Express + JWT              |
| Banco       | PostgreSQL (Neon)                    |
| Hospedagem  | Vercel (front) · Render (API) · Neon (DB) |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- Backend rodando localmente ou em produção (veja o repositório [PoupEazy_BackEnd](https://github.com/Wesley-GLR/PoupEazy_BackEnd))

---

## Como rodar localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/Wesley-GLR/PoupEazy.git
cd PoupEazy
```

### 2. Configurar variáveis de ambiente

```bash
cd frontend
cp .env.example .env
```

Edite o `.env` com a URL do backend:

```
# Local (backend rodando na sua maquina):
VITE_API_URL=http://localhost:3001/api

# Producao (backend no Render):
# VITE_API_URL=https://poupeazy-backend.onrender.com/api
```

### 3. Instalar dependências e rodar

```bash
npm install
npm run dev
```

O app estará disponível localmente em `http://localhost:5173`.

**Versão em produção:** [poup-eazy.vercel.app](https://poup-eazy.vercel.app)

---

## Hospedagem em produção

O projeto está hospedado e disponível publicamente:

| Serviço | Plataforma | URL |
|---------|------------|-----|
| Frontend | Vercel | [poup-eazy.vercel.app](https://poup-eazy.vercel.app) |
| API (Backend) | Render | [poupeazy-backend.onrender.com](https://poupeazy-backend.onrender.com) |
| Banco de dados | Neon (PostgreSQL) | _(acesso interno)_ |

> O plano free do Render hiberna após um período sem uso — a primeira requisição depois disso fica mais lenta (cold start).

### Recuperação de senha

| Rota                | Descrição                                              |
| ------------------- | ------------------------------------------------------ |
| `/login`            | Tem link "Esqueci minha senha"                         |
| `/esqueci-senha`    | Formulário que dispara o token de reset via API        |
| `/redefinir-senha`  | Página para definir a nova senha com o token           |

O envio usa a Gmail API no backend. Configure `EMAIL_ENABLED`, as credenciais
OAuth e `PASSWORD_RESET_URL` na API, conforme o README do backend. A URL de
recuperação deve apontar para o mesmo ambiente de API utilizado pelo site:
por exemplo, no teste local, API em `http://localhost:3001/api` e página em
`http://localhost:5173/redefinir-senha`.

O link recebido por e-mail funciona no navegador, inclusive para solicitações
feitas pelo aplicativo. Ao concluir, a tela orienta voltar ao app e entrar com a
nova senha. Links inválidos/expirados/usados oferecem uma nova solicitação. Os
tokens não são retornados pela API nem utilizados para login automático.

### Exclusão de conta

A rota pública `/excluir-conta` funciona com ou sem sessão e sem precisar instalar
o aplicativo. O usuário informa e-mail, senha atual e a confirmação `EXCLUIR`.
A página chama `POST /api/auth/delete-account`, que deve estar publicado no backend
antes de disponibilizar o fluxo no site e na versão mobile.

A exclusão remove a conta e seus dados associados da base ativa do PoupEazy. A
página explica o alcance da remoção e oferece `poupeazy@gmail.com` como canal de
solicitação/atendimento. Dados em serviços externos e cópias de segurança não são
apagados automaticamente por esse formulário. O link também aparece no rodapé
da página inicial e no Perfil do aplicativo mobile.

### Política de Privacidade

A rota pública `/privacidade` identifica a Equipe do projeto acadêmico PoupEazy e
o contato `poupeazy@gmail.com`. Ela descreve os dados utilizados no site/app,
e-mails, relatórios e integrações opcionais, além da retenção e dos limites da
exclusão. O projeto organiza informações financeiras e não movimenta dinheiro;
isso não torna os dados de cadastro, registros ou mensagens automaticamente fictícios.

O acesso está disponível na página inicial, nas telas de autenticação, no Perfil
e na página de exclusão. A rota não exige sessão nem resposta da API. Publique o
site antes de distribuir o app com o link
`https://poup-eazy.vercel.app/privacidade`. Esta alteração não exige migração SQL
nem novas variáveis de ambiente.

Antes das declarações finais no Google Play, a equipe deve conferir os períodos
efetivos de retenção de logs/backups nos provedores, o provedor ativo do WhatsApp
e o procedimento para atender exclusões também nos serviços externos que tratam
dados em nome do projeto. A exclusão atual remove a base ativa local, mas não
revoga a conexão remota da Pluggy nem apaga cópias de mensagens. A política
informa esses limites; o texto, por si só, não implementa exclusão nos terceiros.
Consulte os [requisitos oficiais de exclusão de conta](https://support.google.com/googleplay/android-developer/answer/13327111?hl=pt-BR)
antes de declarar esse processo concluído no Console. As permissões e os SDKs
devem ser conferidos no AAB efetivamente distribuído.

### Confirmação de cadastro por e-mail

Novos cadastros precisam confirmar o e-mail antes do primeiro login. A tela de
cadastro orienta abrir o link recebido e oferece reenvio com intervalo de um
minuto. O link abre a rota pública `/confirmar-email`, disponível com ou sem
sessão, e a confirmação acontece ao clicar no botão da página.

Após confirmar, o usuário entra com e-mail e senha no site ou volta ao aplicativo.
Links vencidos ou já usados oferecem reenvio. O cadastro e a confirmação não
autenticam automaticamente.

A API deve ter a migration `007_email_verification.sql` aplicada e a variável
`EMAIL_VERIFICATION_URL` apontando para a página deste ambiente. As contas
anteriores à migration mantêm acesso sem confirmação obrigatória. Consulte o
README do backend para a ordem de atualização do banco e dos serviços.

---

## Estrutura do Projeto

```

## Fluxo técnico da aplicação

1. Usuário acessa o frontend React e passa pelo roteamento em `App.tsx`.
2. `AuthProvider` valida a sessão via JWT (armazenado no `localStorage`) e disponibiliza `user/profile`.
3. As páginas consomem hooks (`useTransactions`, `useBudget`, `useGoals`, `useCategories`) para ler/escrever dados via API REST.
4. O backend filtra todas as queries por `id_usuario`, garantindo acesso somente aos dados do usuário autenticado.
5. Triggers no banco recalculam automaticamente valores derivados (como `orcamento.valor_real` e `metas.valor_atual`).

### Como navegar no código sem se perder

- Comece por `frontend/src/main.tsx` e `frontend/src/App.tsx` para entender bootstrap e rotas.
- Em seguida leia `frontend/src/hooks` para entender as regras de negócio e chamadas à API.
- Veja `frontend/src/lib/api.ts` para entender o cliente HTTP central (fetch + JWT).
- Depois veja `frontend/src/pages` para entender como os dados chegam na interface.
- Use `frontend/src/types/database.ts` como contrato oficial de dados entre UI e API.

PoupEazy/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, AuthLayout, AppLayout
│   │   │   ├── ui/                # Card, ProgressBar, Modal
│   │   │   └── charts/            # PieChart, BarChart (Recharts)
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── Goals.tsx
│   │   │   └── Budget.tsx
│   │   ├── hooks/                 # useAuth, useTransactions, etc.
│   │   ├── lib/                   # Cliente HTTP (api.ts), formatadores

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
| RF02   | Chatbot WhatsApp                       | Implementado · requer configuração no backend |
| RF03   | Metas e gastos                        | Implementado     |
| RF04   | Integração Open Finance               | Estrutura pronta |
| RF05   | Categorização automática              | Parcial          |
| RF06   | Relatórios financeiros                | Implementado     |
| RF07   | Notificações e alertas                | Estrutura pronta |
| RF08   | Orçamentos mensais                    | Implementado     |
| RNF01  | Interface intuitiva                   | Implementado     |
| RNF02  | Proteção de dados (JWT + filtro por usuário) | Implementado     |
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
