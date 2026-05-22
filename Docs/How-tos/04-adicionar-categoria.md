# 🔧 How-to: Adicionar Nova Categoria

> Como criar categorias personalizadas no PoupEazy, tanto pela interface quanto diretamente no banco.

---

## Via Interface do Usuário

### 1. Acessar a página de Categorias

1. No menu lateral, clique em **📂 Categorias**
2. Você verá as categorias divididas entre:
   - **Categorias do Sistema** (protegidas, não editáveis) — marcadas com ícone de cadeado
   - **Minhas Categorias** (personalizadas) — criadas por você

### 2. Criar uma nova categoria

1. Clique em **+ Nova Categoria**
2. Preencha:

   | Campo | Descrição | Exemplo |
   |-------|-----------|---------|
   | **Nome** | Nome descritivo | "Pet Shop" |
   | **Tipo** | Classificação fiscal | `despesa_variavel` |
   | **Ícone** | Nome do ícone Lucide | `dog` |

3. Clique em **Salvar**

### Tipos disponíveis

| Tipo | Descrição | Uso |
|------|-----------|-----|
| `despesa_fixa` | Gasto recorrente e previsível | Aluguel, assinaturas, seguro |
| `despesa_variavel` | Gasto que varia por mês | Alimentação, lazer, compras |
| `receita` | Entrada de dinheiro | Salário, freelance, investimentos |

### Encontrar nomes de ícones

Os ícones são do [Lucide](https://lucide.dev/icons/). Para encontrar o nome correto:

1. Acesse [lucide.dev/icons](https://lucide.dev/icons/)
2. Busque pelo ícone desejado (ex: "dog", "car", "music")
3. Use o nome exato em letras minúsculas com hífens

---

## Via Supabase (SQL)

Para inserir categorias diretamente no banco:

```sql
-- Categoria personalizada para um usuário específico
INSERT INTO categoria (id_usuario, nome, tipo, icone, sistema)
VALUES (
    'UUID-DO-USUARIO',  -- Obtido via auth.uid()
    'Pet Shop',
    'despesa_variavel',
    'dog',
    FALSE               -- FALSE = categoria personalizada
);

-- Categoria do sistema (visível para todos)
INSERT INTO categoria (id_usuario, nome, tipo, icone, sistema)
VALUES (
    NULL,               -- NULL = categoria do sistema
    'Impostos',
    'despesa_fixa',
    'landmark',
    TRUE                -- TRUE = protegida contra exclusão
);
```

---

## Editar ou Excluir

- **Editar:** Clique no ícone ✏️ ao lado da categoria personalizada
- **Excluir:** Clique no ícone 🗑️ (somente categorias personalizadas)

> ⚠️ **Categorias do sistema** (como Alimentação, Transporte, Salário) são protegidas por um trigger no banco e não podem ser excluídas.

---

## Constraint de Unicidade

O banco possui uma constraint `uq_categoria_nome_tipo_usuario` que impede:
- Dois registros com o mesmo nome, tipo e usuário
- Isso garante que você não crie duplicatas acidentalmente
