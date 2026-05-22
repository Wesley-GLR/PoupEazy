# 💡 Explanação: Decisões Técnicas (ADRs)

> Registro das decisões arquiteturais mais relevantes do projeto PoupEazy e suas justificativas.

---

## ADR-001: React + Vite como stack de frontend

**Contexto:** Precisávamos de um framework moderno, com boa DX e ecossistema maduro.

**Decisão:** React 18 com Vite como bundler.

**Justificativa:**
- React é o framework mais adotado no mercado, facilitando a curva de aprendizado da equipe
- Vite oferece HMR (Hot Module Replacement) instantâneo, acelerando o desenvolvimento
- TypeScript integrado para segurança de tipos
- Ecossistema rico de bibliotecas (Recharts, Lucide, React Router)

**Alternativas consideradas:**
- Next.js — SSR desnecessário para esta aplicação SPA
- Angular — Curva de aprendizado mais íngreme para a equipe
- Vue.js — Menor familiaridade da equipe

---

## ADR-002: Supabase como BaaS (Backend-as-a-Service)

**Contexto:** O projeto precisava de autenticação, banco de dados e APIs, mas a equipe queria focar no frontend.

**Decisão:** Usar Supabase em vez de construir um backend customizado.

**Justificativa:**
- Autenticação pronta (email/senha, OAuth)
- PostgreSQL gerenciado com RLS para segurança
- Client JS com tipagem TypeScript
- Plano gratuito suficiente para o escopo acadêmico
- Redução drástica do tempo de desenvolvimento

**Trade-offs:**
- Lógica de negócio fica no frontend (exposta)
- Vendor lock-in com o Supabase
- Sem controle total sobre o backend

---

## ADR-003: Row Level Security (RLS) para isolamento de dados

**Contexto:** Cada usuário deve ver apenas seus próprios dados, sem um middleware de backend.

**Decisão:** Implementar RLS em todas as tabelas com policies baseadas em `auth.uid()`.

**Justificativa:**
- Segurança no nível do banco de dados (não depende do frontend)
- Impossível acessar dados de outro usuário, mesmo manipulando o código JS
- Padrão nativo do PostgreSQL, sem overhead de performance
- Tabela `despesas` usa validação via `id_orcamento` para derivar propriedade indiretamente

---

## ADR-004: Triggers para cálculos derivados

**Contexto:** `orcamento.valor_real` e `metas.valor_atual` precisam ser sempre consistentes com as transações.

**Decisão:** Usar triggers PostgreSQL para recalcular automaticamente.

**Justificativa:**
- Garante consistência mesmo se o frontend tiver bugs
- Execução atômica dentro da transação do banco
- Sem necessidade de lógica duplicada no frontend
- Performance aceitável para o volume de dados esperado

**Trade-off:**
- Triggers são "invisíveis" e podem dificultar debug
- Documentação necessária para que a equipe entenda o comportamento

---

## ADR-005: Tailwind CSS v4 para estilização

**Contexto:** Precisávamos de um sistema de estilização produtivo e consistente.

**Decisão:** Tailwind CSS v4 com classes utilitárias.

**Justificativa:**
- Desenvolvimento rápido sem criar arquivos CSS separados
- Design system consistente (cores, espaçamentos, tipografia)
- Purge automático remove CSS não utilizado (bundle mínimo)
- Boa integração com React (classes dinâmicas)

---

## ADR-006: Vercel para deploy

**Contexto:** Precisávamos de um hosting gratuito, rápido e com integração GitHub.

**Decisão:** Vercel como plataforma de deploy.

**Justificativa:**
- Deploy automático a cada push na `main`
- CDN global para baixa latência
- SSL automático
- Preview deployments para PRs
- Plano gratuito generoso para projetos acadêmicos
- Suporte nativo para Vite/React
