# 💡 Explanação: Framework Diátaxis — Por que usamos

> Entendimento do framework de documentação Diátaxis e por que foi adotado no PoupEazy.

---

## O que é o Diátaxis?

O [Diátaxis](https://diataxis.fr/) é um framework para organizar documentação técnica criado por Daniele Procida. O nome vem do grego "dia" (através) + "taxis" (arranjo), significando "arranjo sistemático".

O framework identifica **quatro modos distintos** de documentação, cada um atendendo a uma necessidade diferente do leitor:

```
                    PRÁTICO
                       │
        Tutoriais      │      How-tos
     (aprendizado)     │    (tarefas)
                       │
  ESTUDO ─────────────┼──────────── TRABALHO
                       │
       Explanações     │    Referências
    (entendimento)     │   (informação)
                       │
                   TEÓRICO
```

---

## Os Quatro Quadrantes

### 🎓 Tutoriais (Learning-oriented)

**O que são:** Lições guiadas passo a passo que ensinam o leitor a fazer algo.

**Características:**
- Orientados ao **aprendizado**
- O leitor é um **iniciante** no assunto
- Foco em **fazer junto** (hands-on)
- Resultados visíveis a cada passo

**No PoupEazy:** Configurar o ambiente, criar a primeira transação, definir metas.

---

### 🔧 How-tos (Task-oriented)

**O que são:** Receitas práticas para resolver problemas específicos.

**Características:**
- Orientados a **tarefas**
- O leitor já tem conhecimento básico
- Foco em **resolver** um problema concreto
- Não ensinam conceitos, assumem que o leitor já sabe

**No PoupEazy:** Configurar CI/CD, fazer deploy, adicionar categorias.

---

### 📖 Referências (Information-oriented)

**O que são:** Descrição técnica precisa e completa dos componentes.

**Características:**
- Orientadas à **informação**
- Material de **consulta** (não de leitura linear)
- Objetivas, precisas, atualizadas
- Estrutura espelha a estrutura do código

**No PoupEazy:** Esquema do banco, API/hooks, componentes, variáveis de ambiente.

---

### 💡 Explanações (Understanding-oriented)

**O que são:** Discussões conceituais que explicam o "porquê" das coisas.

**Características:**
- Orientadas ao **entendimento**
- Exploram contexto, alternativas e trade-offs
- Leitura mais livre e discursiva
- Ajudam a formar um modelo mental do sistema

**No PoupEazy:** Arquitetura, decisões técnicas (ADRs), segurança/RLS.

---

## Por que adotamos no PoupEazy?

1. **Clareza organizacional:** Cada documento tem um propósito claro — não mistura tutorial com referência
2. **Facilidade de contribuição:** Novos membros da equipe sabem exatamente onde colocar cada tipo de conteúdo
3. **Cobertura completa:** Os quatro quadrantes garantem que todos os tipos de necessidade do leitor são atendidos
4. **Requisito acadêmico:** A disciplina de ADS III exige documentação estruturada seguindo o Diátaxis

---

## Erros Comuns a Evitar

| ❌ Erro | ✅ Correto |
|---------|-----------|
| Tutorial que lista todos os parâmetros de uma função | Isso é referência — mova para a seção de Referências |
| Referência que explica por que a arquitetura foi escolhida | Isso é explanação — mova para Explanações |
| How-to que ensina conceitos básicos antes de resolver o problema | Isso é tutorial — faça um link para o tutorial relevante |
| Explanação com passos numerados para configurar algo | Isso é how-to — mova para How-tos |

---

## Referências

- [diataxis.fr](https://diataxis.fr/) — Site oficial do framework
- [The Grand Unified Theory of Documentation](https://www.youtube.com/watch?v=t4vKPhjcMZg) — Palestra do criador Daniele Procida
