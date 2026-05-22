# 🔧 How-to: Gerenciar Orçamentos Mensais

> Como criar, visualizar e gerenciar orçamentos mensais no PoupEazy.

---

## O que é um Orçamento Mensal?

O orçamento mensal é o planejamento financeiro para um mês específico. Ele define:

- **Valor Planejado** — Quanto você pretende gastar no mês
- **Valor Real** — Quanto efetivamente gastou (calculado automaticamente)
- **Desvio** — Diferença entre planejado e real

---

## Criar um Orçamento

### Via Interface

1. No menu lateral, clique em **📊 Orçamentos**
2. Clique em **+ Novo Orçamento**
3. Preencha:

   | Campo | Descrição | Exemplo |
   |-------|-----------|---------|
   | **Mês** | Mês de referência | Maio |
   | **Ano** | Ano de referência | 2026 |
   | **Valor Planejado** | Limite de gastos | 3000.00 |

4. Clique em **Salvar**

### Criação Automática

Quando você registra uma transação para um mês que ainda não tem orçamento, o sistema pode criar um automaticamente com `valor_planejado = 0`.

---

## Visualizar o Comparativo

Na página de Orçamentos, você encontra:

1. **Cards de cada mês** — Mostrando planejado vs real com barra de progresso
2. **Gráfico de barras anual** — Comparativo visual de todos os meses do ano
3. **Indicadores visuais:**
   - 🟢 Verde: gasto abaixo do planejado
   - 🟡 Amarelo: gasto entre 80-100% do planejado
   - 🔴 Vermelho: gasto acima do planejado

---

## Editar um Orçamento

1. Encontre o orçamento desejado na lista
2. Clique no ícone ✏️
3. Ajuste o **Valor Planejado**
4. Salve

> O **Valor Real** não pode ser editado manualmente — ele é sempre recalculado pelo trigger `trg_orcamento_valor_real` com base nas transações vinculadas.

---

## Entendendo o Cálculo Automático

O `valor_real` é calculado pela fórmula:

```
valor_real = Σ(despesas confirmadas) - Σ(receitas confirmadas)
```

Isso significa que:
- Despesas **aumentam** o valor real
- Receitas **diminuem** o valor real (como se fossem "créditos")
- Transações canceladas ou pendentes **não são contadas**

O trigger é executado automaticamente a cada inserção, atualização ou exclusão de transações.

---

## Constraint de Unicidade

O banco impede a criação de dois orçamentos para o mesmo mês/ano/usuário:

```
CONSTRAINT uq_orcamento_usuario_mes_ano UNIQUE (id_usuario, mes, ano)
```

Se tentar criar duplicatas, receberá um erro de constraint.

---

## Dicas

- **Planeje no início do mês:** Defina o orçamento antes de iniciar os gastos
- **Revise semanalmente:** Acompanhe o progresso para evitar surpresas
- **Use o gráfico anual:** Identifique padrões de gastos ao longo dos meses
- **Ajuste conforme necessário:** É normal precisar revisar o planejamento
