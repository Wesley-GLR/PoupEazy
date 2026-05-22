# PoupEazy - Próximos Passos

Documento de organização para o grupo. Lista os requisitos que ainda precisam ser implementados ou finalizados, com descrição técnica do que precisa ser feito, arquivos envolvidos e sugestão de responsável.

---

## Situação Atual

| Código | Descrição                        | Status atual      |
| ------ | -------------------------------- | ----------------- |
| RF01   | Gerenciar usuários               | Implementado      |
| RF02   | ChatBot WhatsApp                 | Estrutura pronta  |
| RF03   | Metas e gastos                   | Implementado      |
| RF04   | Integração Open Finance          | Estrutura pronta  |
| RF05   | Categorização automática         | Parcial           |
| RF06   | Relatórios financeiros           | Implementado      |
| RF07   | Notificações e alertas           | Estrutura pronta  |
| RF08   | Orçamentos mensais               | Implementado      |
| RNF01  | Interface intuitiva              | Implementado      |
| RNF02  | Proteção de dados (RLS)          | Implementado      |
| RNF04  | Suportar diversos navegadores    | Implementado      |
| RNF05  | Suporte Android e iOS            | Não iniciado      |
| RNF06  | Sincronização em tempo real      | Não iniciado      |

**Requisitos que precisam de trabalho: RF02, RF04, RF05, RF07, RNF05, RNF06**

---

## RF02 - ChatBot WhatsApp (Prioridade 3)

### O que já existe
- Campo `origem` na tabela `despesas` aceita valor `'chatbot'`
- Campo `nlp_metadata` (JSONB) preparado para armazenar dados do NLP
- Botão "Registrar via WhatsApp" na página de Transações (link placeholder)

### O que falta fazer

**Nível 1 - MVP Simulado (mais fácil, recomendado para a entrega):**
- Criar uma página `/chatbot` dentro do app que simule a interação de chatbot
- O usuário digita uma mensagem no formato "mercado 150" e o sistema interpreta e cria a transação
- Parser simples: separar texto em "descrição" + "valor" (última palavra numérica)
- Salvar a transação com `origem: 'chatbot'`

**Nível 2 - Integração Real (complexo, pós-entrega):**
- Criar conta na API do WhatsApp Business (Meta)
- Criar um backend (Supabase Edge Functions ou servidor Node.js) que receba webhooks do WhatsApp
- Implementar NLP básico para interpretar mensagens
- Conectar ao banco de dados para criar transações

### Arquivos envolvidos
- `frontend/src/pages/` - criar novo `ChatBot.tsx`
- `frontend/src/App.tsx` - adicionar rota `/chatbot`
- `frontend/src/components/layout/Sidebar.tsx` - adicionar item na navegação
- `frontend/src/hooks/useTransactions.ts` - reutilizar `addTransaction`

### Sugestão de responsável
1 pessoa (frente do chatbot simulado)

---

## RF04 - Integração Open Finance (Prioridade 1)

### O que já existe
- Tabela `open_finance_tokens` no banco com campos para tokens OAuth 2.0
- Políticas RLS configuradas
- Tipos TypeScript definidos (`OpenFinanceToken`)

### O que falta fazer

**Nível 1 - Interface de Gerenciamento (recomendado para a entrega):**
- Criar página `/integracoes` que mostra as integrações bancárias do usuário
- Listar bancos conectados (dados da tabela `open_finance_tokens`)
- Botão "Conectar banco" que abre um modal com formulário (instituição)
- Status de conexão (ativo/expirado) com base no campo `expira_em`
- Botão para desconectar (deletar token)

**Nível 2 - Integração Real (complexo, requer parceria com bancos):**
- Registrar-se no portal Open Finance Brasil
- Implementar fluxo OAuth 2.0 (redirect, code exchange, token storage)
- Criar Supabase Edge Function para sincronizar transações automaticamente
- Criptografia AES-256-GCM dos tokens

### Arquivos envolvidos
- `frontend/src/pages/` - criar novo `Integrations.tsx`
- `frontend/src/hooks/` - criar novo `useIntegrations.ts`
- `frontend/src/App.tsx` - adicionar rota `/integracoes`
- `frontend/src/components/layout/Sidebar.tsx` - adicionar item na navegação

### Sugestão de responsável
1 pessoa

---

## RF05 - Categorização Automática (Prioridade 2)

### O que já existe
- Campo `nlp_metadata` (JSONB) na tabela `despesas`
- Categorias do sistema com tipos definidos (despesa_fixa, despesa_variavel, receita)
- O usuário já pode selecionar categoria manualmente ao criar transação

### O que falta fazer

**Implementar sugestão automática de categoria ao criar transação:**

1. Criar um mapa de palavras-chave por categoria no frontend:
   ```
   Alimentação: mercado, supermercado, restaurante, lanche, padaria, ifood
   Transporte: uber, 99, combustível, gasolina, estacionamento, pedágio
   Moradia: aluguel, condomínio, luz, água, gás, internet
   Saúde: farmácia, médico, hospital, consulta, exame
   Lazer: cinema, netflix, spotify, bar, viagem, jogo
   Educação: livro, curso, faculdade, material
   Assinaturas: mensalidade, assinatura, plano
   ```

2. Quando o usuário digitar a descrição da transação, o sistema sugere a categoria automaticamente
3. O campo categoria é pré-preenchido mas o usuário pode alterar
4. Salvar as informações de categorização em `nlp_metadata`:
   ```json
   { "sugestao_automatica": true, "confianca": 0.8, "palavras_chave": ["mercado"] }
   ```

### Arquivos envolvidos
- `frontend/src/lib/` - criar novo `categorizer.ts` com o mapa de palavras-chave
- `frontend/src/pages/Transactions.tsx` - adicionar auto-sugestão no formulário
- `frontend/src/hooks/useTransactions.ts` - incluir `nlp_metadata` no payload

### Sugestão de responsável
1 pessoa

---

## RF07 - Notificações e Alertas (Prioridade 2)

### O que já existe
- Tabela `notificacoes` no banco com campos: tipo, titulo, mensagem, lida
- Políticas RLS para que cada usuário veja apenas suas notificações
- Tipos TypeScript definidos (`Notificacao`)

### O que falta fazer

**Parte 1 - Interface de Notificações:**
- Criar componente de sino (bell icon) no header/sidebar com badge de contagem de não lidas
- Criar dropdown ou página `/notificacoes` que lista as notificações
- Marcar como lida ao clicar
- Excluir notificação

**Parte 2 - Geração Automática de Alertas:**
- Criar Supabase Edge Function (ou lógica no frontend) que verifica:
  - Se `valor_real` do orçamento do mês ultrapassou `valor_planejado` -> alerta tipo `alerta_limite`
  - Se alguma meta está a menos de 30 dias do prazo e abaixo de 50% -> alerta tipo `meta_proxima`
  - Se meta atingiu 100% -> alerta tipo `meta_concluida`
- Rodar essa verificação ao fazer login ou em intervalo periódico

**Parte 3 - Dicas Financeiras (bônus):**
- Array estático de dicas financeiras no frontend
- Inserir uma dica aleatória como notificação tipo `dica` ao fazer login (1x por dia)

### Arquivos envolvidos
- `frontend/src/hooks/` - criar novo `useNotifications.ts`
- `frontend/src/components/layout/Sidebar.tsx` - adicionar ícone de sino com badge
- `frontend/src/pages/` - criar novo `Notifications.tsx` (ou componente dropdown)
- `frontend/src/lib/` - criar novo `alertEngine.ts` com lógica de verificação

### Sugestão de responsável
1-2 pessoas (1 para interface, 1 para lógica de alertas)

---

## RNF05 - Suporte Android e iOS (Prioridade 2)

### O que já existe
- App web responsivo (funciona em mobile pelo navegador)

### O que falta fazer

**Opção A - PWA (Progressive Web App) - Recomendado:**
- Adicionar `manifest.json` na pasta `public/` com nome, ícones e cores do app
- Registrar Service Worker para cache offline básico
- Adicionar meta tags para instalação em tela inicial
- Com isso o usuário pode "instalar" o site no celular como se fosse um app

**Opção B - React Native (complexo, não recomendado para o prazo):**
- Reescrever o frontend inteiro em React Native
- Compartilhar hooks e lógica, mas recriar todas as telas

### Arquivos envolvidos
- `frontend/public/manifest.json` - criar
- `frontend/public/` - ícones do app em vários tamanhos (192x192, 512x512)
- `frontend/src/` - registrar service worker no `main.tsx`
- `frontend/index.html` - adicionar link para manifest

### Sugestão de responsável
1 pessoa

---

## RNF06 - Sincronização em Tempo Real (Prioridade 1)

### O que já existe
- Supabase já suporta Realtime nativamente (WebSockets)
- Cliente Supabase JS já está configurado no projeto

### O que falta fazer

Ativar Realtime subscriptions nos hooks existentes para que mudanças no banco reflitam imediatamente na interface sem precisar recarregar:

```typescript
// Exemplo em useTransactions.ts
useEffect(() => {
  const channel = supabase
    .channel('despesas-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'despesas'
    }, () => {
      fetch() // recarrega os dados
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])
```

Repetir para:
- `useGoals.ts` (tabela `metas`)
- `useBudget.ts` (tabela `orcamento`)
- `useCategories.ts` (tabela `categoria`)
- `useNotifications.ts` (tabela `notificacoes`)

Ativar Realtime no Supabase Dashboard:
- Ir em Database > Replication
- Ativar publicação para as tabelas: `despesas`, `metas`, `orcamento`, `categoria`, `notificacoes`

### Arquivos envolvidos
- `frontend/src/hooks/useTransactions.ts`
- `frontend/src/hooks/useGoals.ts`
- `frontend/src/hooks/useBudget.ts`
- `frontend/src/hooks/useCategories.ts`

### Sugestão de responsável
1 pessoa (alterações pequenas em vários arquivos)

---

## Sugestão de Distribuição por Membro

Com base no grupo de 8 pessoas e considerando que RF01, RF03, RF06, RF08 já estão prontos:

| Membro     | Tarefa                                      | Requisito | Estimativa |
| ---------- | ------------------------------------------- | --------- | ---------- |
| Pessoa 1   | ChatBot simulado no app                     | RF02      | 3-4 dias   |
| Pessoa 2   | Página de integrações bancárias             | RF04      | 2-3 dias   |
| Pessoa 3   | Categorização automática por palavras-chave | RF05      | 2-3 dias   |
| Pessoa 4   | Interface de notificações (sino + listagem) | RF07      | 2-3 dias   |
| Pessoa 5   | Lógica de alertas automáticos               | RF07      | 3-4 dias   |
| Pessoa 6   | PWA (manifest + service worker)             | RNF05     | 1-2 dias   |
| Pessoa 7   | Realtime subscriptions em todos os hooks    | RNF06     | 1-2 dias   |
| Pessoa 8   | Testes, QA, revisão geral e documentação    | Todos     | contínuo   |

---

## Ordem Recomendada de Implementação

1. **RNF06 - Realtime** (rápido, melhora a experiência imediatamente)
2. **RF05 - Categorização automática** (melhora a usabilidade, só frontend)
3. **RF07 - Notificações** (interface + alertas, pode ser feito em paralelo)
4. **RF02 - ChatBot simulado** (funcionalidade nova, independente)
5. **RF04 - Página de integrações** (interface, pode ser só visual para a entrega)
6. **RNF05 - PWA** (finalização, polimento)

---

## Padrão de Desenvolvimento

Para manter o código consistente, todo mundo deve seguir:

1. **Criar hooks em `src/hooks/`** para lógica de dados (seguir padrão do `useTransactions.ts`)
2. **Criar páginas em `src/pages/`** (seguir padrão do `Transactions.tsx`)
3. **Adicionar rotas em `src/App.tsx`** dentro do bloco `ProtectedRoute`
4. **Adicionar link na Sidebar** em `src/components/layout/Sidebar.tsx`
5. **Usar as cores do tema** (`text-primary`, `bg-surface`, `text-muted`, etc.)
6. **Usar Lucide React** para ícones (importar de `lucide-react`)
7. **Usar `react-hot-toast`** para feedback ao usuário (toast.success / toast.error)
8. **Rodar `npx tsc --noEmit`** antes de commitar para garantir zero erros de tipo
