# 💡 Explanação: Arquitetura do Sistema

> Entendimento da arquitetura do PoupEazy, suas camadas e como os componentes se comunicam.

---

## Visão Geral

O PoupEazy segue uma arquitetura **serverless** com frontend SPA (Single Page Application) conectado diretamente ao **Supabase** como Backend-as-a-Service (BaaS).

```
┌─────────────────────────────────────────────────────────┐
│                     USUÁRIO                             │
│                  (Navegador Web)                        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 VERCEL (Hosting)                        │
│    ┌─────────────────────────────────────────┐          │
│    │         Frontend React + Vite           │          │
│    │                                         │          │
│    │  ┌──────────┐  ┌──────────┐  ┌───────┐ │          │
│    │  │  Pages   │  │  Hooks   │  │  Lib  │ │          │
│    │  │          │──│          │──│       │ │          │
│    │  │Dashboard │  │useAuth   │  │supabase│ │          │
│    │  │Transacts │  │useBudget │  │client │ │          │
│    │  │Goals     │  │useGoals  │  │       │ │          │
│    │  │Budget    │  │useTrans. │  │       │ │          │
│    │  └──────────┘  └──────────┘  └───┬───┘ │          │
│    └──────────────────────────────────┼─────┘          │
└───────────────────────────────────────┼────────────────┘
                                        │ HTTPS / WSS
                                        ▼
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE (BaaS)                       │
│                                                         │
│  ┌─────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth   │  │  PostgreSQL  │  │    Row Level      │  │
│  │         │  │              │  │    Security       │  │
│  │ JWT     │  │  7 tabelas   │  │    (RLS)          │  │
│  │ Session │  │  6 triggers  │  │  Isolamento por   │  │
│  │         │  │  3 views     │  │  auth.uid()       │  │
│  └─────────┘  │  10 índices  │  └───────────────────┘  │
│               └──────────────┘                          │
└─────────────────────────────────────────────────────────┘
```

---

## Por que essa arquitetura?

### Vantagens

1. **Sem servidor para gerenciar** — O Supabase cuida de infraestrutura, backups e escalabilidade
2. **Custo zero para prototipagem** — O plano gratuito do Supabase é suficiente para o projeto acadêmico
3. **Desenvolvimento rápido** — Sem necessidade de construir APIs REST manualmente
4. **Segurança nativa** — RLS garante isolamento de dados sem código adicional no backend
5. **Realtime pronto** — WebSockets disponíveis para atualizações em tempo real

### Limitações

1. **Lógica de negócio no frontend** — Regras complexas ficam expostas no código JS
2. **Sem middleware** — Não há camada intermediária para transformações complexas
3. **Vendor lock-in** — Dependência do ecossistema Supabase
4. **Limitações do plano gratuito** — 500MB de banco, 1GB de storage, 2GB de bandwidth

---

## Fluxo de Dados

### Autenticação

```
1. Usuário preenche email/senha
2. Frontend chama supabase.auth.signInWithPassword()
3. Supabase valida credenciais e retorna JWT
4. JWT é armazenado no localStorage
5. Todas as requisições subsequentes incluem o JWT
6. RLS usa auth.uid() do JWT para filtrar dados
```

### Transação (CRUD)

```
1. Usuário cria transação na interface
2. Hook useTransactions chama supabase.from('despesas').insert()
3. Supabase valida RLS (via id_orcamento → orcamento → id_usuario)
4. Dados são inseridos na tabela despesas
5. Trigger trg_orcamento_valor_real recalcula orcamento.valor_real
6. Trigger trg_metas_valor_atual recalcula metas.valor_atual (se vinculada)
7. Frontend recebe confirmação e atualiza estado local
8. Dashboard reflete os novos valores
```

---

## Camadas da Aplicação

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|-----------------|
| **Apresentação** | React + Tailwind | Interface do usuário, navegação, formulários |
| **Estado** | React Hooks | Gerenciamento de estado local e comunicação com banco |
| **Dados** | Supabase JS Client | Operações CRUD, autenticação |
| **Persistência** | PostgreSQL 15+ | Armazenamento, triggers, views, índices |
| **Segurança** | Supabase Auth + RLS | Autenticação JWT, isolamento de dados por usuário |
| **Deploy** | Vercel | Hospedagem do frontend, CDN, SSL |
