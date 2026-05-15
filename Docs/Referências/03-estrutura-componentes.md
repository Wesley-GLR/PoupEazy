# 📖 Referência: Estrutura de Componentes React

> Mapa completo dos componentes, páginas e rotas do frontend.

---

## Árvore de Componentes

```
src/
├── main.tsx                    # Entry point, renderiza App
├── App.tsx                     # Rotas e providers (AuthProvider)
├── index.css                   # Estilos globais
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # Layout principal (sidebar + conteúdo)
│   │   ├── AuthLayout.tsx      # Layout de autenticação (login/registro)
│   │   └── Sidebar.tsx         # Menu lateral de navegação
│   ├── ui/
│   │   ├── Card.tsx            # Componente de card reutilizável
│   │   ├── ProgressBar.tsx     # Barra de progresso
│   │   └── Modal.tsx           # Modal/dialog
│   └── charts/
│       ├── PieChart.tsx        # Gráfico pizza (Recharts)
│       └── BarChart.tsx        # Gráfico de barras (Recharts)
│
├── pages/
│   ├── Login.tsx               # Tela de login
│   ├── Register.tsx            # Tela de cadastro
│   ├── Dashboard.tsx           # Painel principal
│   ├── Transactions.tsx        # CRUD de transações
│   ├── Categories.tsx          # Gerenciamento de categorias
│   ├── Goals.tsx               # Metas financeiras
│   └── Budget.tsx              # Orçamentos mensais
│
├── hooks/
│   ├── useAuth.ts              # Autenticação e sessão
│   ├── useTransactions.ts      # CRUD de transações
│   ├── useBudget.ts            # CRUD de orçamentos
│   ├── useGoals.ts             # CRUD de metas
│   └── useCategories.ts        # CRUD de categorias
│
├── lib/
│   ├── supabase.ts             # Cliente Supabase
│   └── formatters.ts           # Formatadores (moeda, data)
│
└── types/
    └── database.ts             # Interfaces TypeScript
```

---

## Rotas

| Rota | Página | Acesso | Descrição |
|------|--------|--------|-----------|
| `/login` | Login.tsx | Público | Tela de login |
| `/register` | Register.tsx | Público | Tela de cadastro |
| `/` | Dashboard.tsx | Autenticado | Painel principal |
| `/transactions` | Transactions.tsx | Autenticado | Transações |
| `/categories` | Categories.tsx | Autenticado | Categorias |
| `/goals` | Goals.tsx | Autenticado | Metas |
| `/budget` | Budget.tsx | Autenticado | Orçamentos |

**Proteção de rotas:** Componente `ProtectedRoute` em `App.tsx` redireciona para `/login` se não autenticado.

---

## Bibliotecas de UI

| Biblioteca | Uso | Importação |
|-----------|-----|------------|
| **Recharts** | Gráficos (pizza, barras) | `import { PieChart, BarChart } from 'recharts'` |
| **Lucide React** | Ícones | `import { Icon } from 'lucide-react'` |
| **react-hot-toast** | Notificações toast | `import toast from 'react-hot-toast'` |
| **Tailwind CSS v4** | Estilização | Classes utilitárias nos componentes |

---

## Padrão de Desenvolvimento

1. Criar hooks em `src/hooks/` para lógica de dados
2. Criar páginas em `src/pages/`
3. Adicionar rotas em `src/App.tsx` dentro de `ProtectedRoute`
4. Adicionar link na `Sidebar.tsx`
5. Usar as cores do tema (`text-primary`, `bg-surface`, etc.)
6. Usar Lucide React para ícones
7. Usar `react-hot-toast` para feedback
8. Rodar `npx tsc --noEmit` antes de commitar
