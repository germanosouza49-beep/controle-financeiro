# FINANCIAL_FEATURES.md
# FinControl -- Analise de Funcionalidades Financeiras

> Documento de analise critica, propostas de melhoria e priorizacao das funcionalidades financeiras do FinControl.
> Autor: Especialista em Financas | Data: Marco 2026

---

## 1. AVALIACAO CRITICA DAS FUNCIONALIDADES PLANEJADAS

### 1.1 O que esta BEM no PRD atual

| Funcionalidade | Avaliacao | Nota (1-5) |
|---|---|---|
| **Dashboard Visual (F1)** | Excelente. Summary cards, 3 tipos de grafico e lista de transacoes cobrem a necessidade basica de visao consolidada. A sidebar de contas/cartoes como filtro global e um diferencial de UX. | 5 |
| **Categorizacao IA (F2)** | Muito boa. O fluxo de confidence >= 0.85 auto-aplica, abaixo vai para review e um padrao de mercado. O historico de correcoes alimentando a IA e fundamental. | 4.5 |
| **Importacao CSV (F3a)** | Solida. Mapeamento de colunas + deteccao de duplicata por hash e a abordagem correta. Preview antes de confirmar protege contra erros. | 4.5 |
| **Importacao PDF (F3b)** | Inovadora. Usar Gemini multimodal para extrair transacoes de PDFs elimina a necessidade de OCR dedicado. Porem, depende da qualidade do modelo com faturas brasileiras. | 4 |
| **Motor IA (F4)** | Ambicioso e bem estruturado. Resumo, corte de gastos, projecao, anomalias e chat cobrem os principais insights. A arquitetura de buscar contexto no Supabase antes de chamar Gemini e correta. | 4.5 |
| **Alertas (F5)** | Adequados. Limite de cartao, vencimento, orcamento e anomalia sao os 4 alertas mais importantes. | 4 |
| **Gestao Contas/Cartoes (F6)** | Basica mas funcional. CRUD com indicador visual de saude (verde/amarelo/vermelho) e suficiente para v1. | 4 |

### 1.2 LACUNAS E PONTOS DE ATENCAO

#### 1.2.1 Lacunas Criticas (devem ser resolvidas)

1. **Ausencia de Fluxo de Caixa Projetado (Cashflow Forecast)**
   - O PRD tem "projecao futura" como modulo IA, mas nao ha uma visualizacao dedicada de fluxo de caixa.
   - O usuario precisa ver: "Nos proximos 30/60/90 dias, quando vou ficar no vermelho?" -- isso e DIFERENTE de projecao de gastos.
   - Fluxo de caixa considera saldos atuais + receitas previstas - despesas previstas - faturas a vencer = saldo projetado dia a dia.

2. **Sem Separacao Pessoa Fisica vs Juridica**
   - Germano gerencia empresa + pessoal. O sistema precisa de tags ou "escopos" (PF/PJ/Socio X) para nao misturar tudo.
   - Sem isso, o dashboard consolidado perde valor porque mistura despesas pessoais com despesas da empresa.

3. **Conciliacao Bancaria Inexistente**
   - Importar CSV/PDF nao e suficiente. O usuario precisa cruzar: "O que o banco diz que eu gastei" vs "O que eu registrei manualmente".
   - Sem conciliacao, nao ha garantia de que os dados estao corretos.

4. **Regras Deterministicas de Categorizacao**
   - O PRD menciona "regras fixas" no prompt do Gemini, mas nao ha uma tabela dedicada para isso.
   - Depender 100% da IA e caro e inconsistente. Regras regex (ex: `*/UBER*/` -> Transporte) devem rodar ANTES da IA.

5. **Sem Relatorios Exportaveis**
   - Dashboard e lindo, mas quando o contador pede um extrato, o usuario precisa de PDF/Excel.
   - Isso e basico para qualquer sistema financeiro sério.

#### 1.2.2 Lacunas Importantes (recomendado para v1.1)

6. **Sem Metas de Economia (Savings Goals)**
   - Orcamentos limitam gastos, mas nao incentivam a poupar.
   - Ex: "Quero juntar R$ 10.000 para ferias ate dezembro" -- com barra de progresso.

7. **Sem Comparativo entre Periodos**
   - O grafico de linhas mostra evolucao, mas nao ha tela dedicada para: "Janeiro 2026 vs Janeiro 2025".
   - Comparativo mes-a-mes e ano-a-ano e essencial para identificar tendencias.

8. **Sem Split de Despesas**
   - Germano gerencia socios e familia. Quem paga quanto? Ex: "Conta do restaurante: 50% Germano, 50% Socio A".
   - Sem isso, a visao de gastos individuais fica distorcida.

9. **Sem DRE Simplificado**
   - Para a parte empresarial, um Demonstrativo de Resultado (Receitas - Custos - Despesas = Lucro) e fundamental.
   - Nao precisa ser contabil, mas precisa mostrar a saude do negocio.

10. **Sem Indice de Saude Financeira**
    - Um score 0-100 baseado em: % comprometimento renda, diversificacao, tendencia, orcamentos cumpridos.
    - Gamificacao que motiva o usuario a melhorar.

---

## 2. PROPOSTAS DE FUNCIONALIDADES ADICIONAIS

### 2.1 Fluxo de Caixa Projetado (Cashflow Forecast)

**O que e:** Visao dia-a-dia do saldo projetado para os proximos 30/60/90 dias, considerando:
- Saldo atual de todas as contas
- Receitas recorrentes previstas (salarios, freelances)
- Despesas recorrentes previstas (aluguel, assinaturas)
- Faturas de cartao a vencer (com base no dia de vencimento)
- Transacoes parceladas futuras

**Visualizacao:**
- Grafico de area mostrando saldo projetado ao longo do tempo
- Linha vermelha horizontal no zero (alerta de saldo negativo)
- Pontos marcados para eventos importantes (vencimento fatura, salario)
- Cenarios: otimista (sem gastos extras) / realista (media historica) / pessimista (picos recentes)

**Impacto:** ALTISSIMO -- responde a pergunta mais importante: "Vou ter dinheiro no fim do mes?"

**Complexidade:** MEDIA -- usa dados ja existentes (recorrencias, parcelas, saldos)

**Implementacao sugerida:**
```
// Novo endpoint
GET /api/cashflow?days=30|60|90

// Logica no backend:
1. Busca saldo atual de todas as contas
2. Busca transacoes recorrentes (is_recurring = true)
3. Busca parcelas futuras (installment_current < installment_total)
4. Busca faturas de cartao (closing_day + due_day)
5. Projeta saldo dia a dia
6. Opcional: Gemini analisa para cenarios otimista/pessimista
```

**Nova tabela sugerida:**
```sql
-- Nenhuma tabela nova necessaria, usa dados existentes
-- Porem, adicionar campo opcional para receitas/despesas planejadas:
ALTER TABLE transactions ADD COLUMN is_planned BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN planned_date DATE;
```

---

### 2.2 Regras Automaticas de Categorizacao (Regex-Based)

**O que e:** Motor de regras deterministicas que roda ANTES da IA, com custo zero e 100% de previsibilidade.

**Regras pre-configuradas para o contexto brasileiro:**
```
PIX.*UBER|UBER.*PIX         -> Transporte
IFOOD|RAPPI|ZDELIVERY       -> Alimentacao
NETFLIX|SPOTIFY|DISNEY|PRIME -> Assinaturas
MERCADO LIVRE|AMAZON|SHOPEE -> Compras
NUBANK.*FATURA|PAGAMENTO.*FATURA -> Parcelas
CEMIG|COPASA|SABESP|CPFL    -> Moradia (Utilidades)
FARMACIA|DROGARIA|DROGA     -> Saude
PIX.*ALUGUEL|ALUGUEL        -> Moradia
SALARIO|PAGAMENTO.*FOLHA    -> Salario (receita)
```

**Fluxo:**
1. Transacao chega sem categoria
2. Motor de regex verifica contra regras do usuario + regras do sistema
3. Se match: aplica categoria com confidence = 1.0 e `ai_categorized = false`
4. Se nao match: encaminha para Gemini (fluxo atual)

**Beneficios:**
- Reduz chamadas IA em 60-70% (economia de custo)
- Instantaneo (sem latencia de API)
- 100% previsivel e editavel pelo usuario
- Nao conta no rate limit de 30/dia

**Nova tabela:**
```sql
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,          -- regex ou texto exato
  match_type TEXT NOT NULL DEFAULT 'contains'
    CHECK (match_type IN ('contains', 'starts_with', 'ends_with', 'regex', 'exact')),
  category_id UUID NOT NULL REFERENCES categories(id),
  priority INTEGER DEFAULT 0,    -- regras com maior prioridade rodam primeiro
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- regras padrao do sistema
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Impacto:** ALTO -- economia de custo e consistencia

**Complexidade:** BAIXA -- logica simples de matching

---

### 2.3 Indice de Saude Financeira (Financial Health Score)

**O que e:** Score de 0 a 100 que avalia a saude financeira geral, atualizado mensalmente.

**Componentes do Score:**

| Componente | Peso | Calculo | Faixa |
|---|---|---|---|
| Comprometimento de Renda | 25% | (Despesas fixas / Receita total) * 100. Ideal < 50% | 0-25 pts |
| Reserva de Emergencia | 20% | (Saldo total / Despesa media mensal). Ideal >= 6 meses | 0-20 pts |
| Utilizacao de Credito | 15% | (Total faturas / Total limites). Ideal < 30% | 0-15 pts |
| Cumprimento de Orcamento | 15% | % de categorias dentro do orcamento no mes | 0-15 pts |
| Tendencia de Economia | 15% | (Receita - Despesa) crescendo nos ultimos 3 meses | 0-15 pts |
| Diversificacao de Receita | 10% | Quantas fontes de receita diferentes existem | 0-10 pts |

**Classificacao:**
- 80-100: Excelente (verde) -- Parabens! Voce esta no controle.
- 60-79: Bom (azul) -- Bom caminho, mas ha espaco para melhorar.
- 40-59: Atencao (amarelo) -- Alguns pontos precisam de cuidado.
- 20-39: Critico (laranja) -- Revise seus gastos urgentemente.
- 0-19: Emergencia (vermelho) -- Procure ajuda profissional.

**Visualizacao:**
- Gauge circular (tipo velocimetro) com o score central
- Breakdown dos 6 componentes em barras horizontais
- Historico do score nos ultimos 12 meses (grafico de linha)
- Dicas personalizadas da IA para melhorar cada componente

**Impacto:** ALTO -- gamificacao e motivacao

**Complexidade:** MEDIA -- calculos sao simples, mas precisa de dados historicos consistentes

---

### 2.4 Metas de Economia (Savings Goals)

**O que e:** Sistema de metas financeiras com acompanhamento visual.

**Funcionalidades:**
- Criar meta com nome, valor alvo, data limite e icone
- Barra de progresso visual com % atingido
- Contribuicoes manuais ou automaticas (regra: X% de toda receita vai para meta Y)
- Projecao: "No ritmo atual, voce atingira a meta em [data]"
- Celebracao visual quando atingir 100%

**Exemplos de metas:**
- Ferias: R$ 10.000 ate Dez/2026
- Reserva de emergencia: R$ 30.000 (sem prazo)
- Novo equipamento PJ: R$ 5.000 ate Jun/2026

**Nova tabela:**
```sql
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,                    -- opcional
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#10B981',
  auto_percentage DECIMAL(5,2),     -- % automatica de receitas
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  source TEXT DEFAULT 'manual',     -- 'manual' | 'auto' | 'transfer'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Impacto:** ALTO -- fundamental para planejamento financeiro

**Complexidade:** BAIXA -- CRUD simples + calculo de progresso

---

### 2.5 Analise Gastos Recorrentes vs Variaveis

**O que e:** Classificacao automatica de gastos em:
- **Fixos:** Aparecem todo mes com valor similar (aluguel, assinaturas, salarios)
- **Variaveis:** Valor e frequencia flutuam (alimentacao, lazer, compras)
- **Pontuais:** Aparecem uma unica vez (compras grandes, viagens)

**Como detectar:**
```
Algoritmo:
1. Agrupar transacoes por descricao similar (fuzzy matching ou IA)
2. Para cada grupo, calcular:
   - Frequencia: quantos meses aparece nos ultimos 6?
   - Variacao: desvio padrao do valor
3. Classificar:
   - Frequencia >= 5/6 e variacao < 15% = FIXO
   - Frequencia >= 3/6 = VARIAVEL
   - Frequencia < 3/6 = PONTUAL
```

**Visualizacao no Dashboard:**
- Donut chart: Fixo X% | Variavel Y% | Pontual Z%
- Lista de gastos fixos com total mensal comprometido
- Lista de assinaturas detectadas com opcao de marcar como "essencial" ou "cortavel"
- Alerta quando um gasto variavel sobe mais de 20% em relacao a media

**Impacto:** ALTO -- responde "onde posso cortar?"

**Complexidade:** MEDIA -- fuzzy matching e algoritmo de classificacao

---

### 2.6 Comparativo entre Periodos

**O que e:** Tela dedicada para comparar dois periodos lado a lado.

**Modos de comparacao:**
- Mes vs mes anterior (ex: Fev/2026 vs Jan/2026)
- Mes vs mesmo mes do ano anterior (ex: Fev/2026 vs Fev/2025)
- Trimestre vs trimestre
- Ano vs ano

**Visualizacao:**
- Tabela lado a lado com todas as categorias
- Coluna de variacao (% e valor absoluto)
- Setas verdes (diminuiu) e vermelhas (aumentou) para despesas
- Grafico de barras comparativo por categoria
- Resumo textual gerado pela IA: "Seus gastos com Alimentacao subiram 23% em relacao ao mes passado, puxados por..."

**Impacto:** ALTO -- insight essencial para tomada de decisao

**Complexidade:** BAIXA -- query de agregacao com filtro de datas

---

### 2.7 Split de Despesas (Divisao entre Membros)

**O que e:** Sistema para dividir despesas entre socios, membros da familia ou grupos.

**Funcionalidades:**
- Marcar transacao como "compartilhada" e definir participantes + percentual
- Dashboard de debitos entre membros: "Socio A deve R$ 1.200 ao Germano"
- Consolidacao mensal: quem deve quanto para quem
- Historico de acertos/pagamentos

**Nova tabela:**
```sql
CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id),
  percentage DECIMAL(5,2) NOT NULL,   -- 50.00 = 50%
  amount DECIMAL(12,2) NOT NULL,       -- valor calculado
  is_settled BOOLEAN DEFAULT false,    -- foi acertado/pago?
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Impacto:** MEDIO-ALTO -- essencial para o caso de uso multi-usuario (socios + familia)

**Complexidade:** MEDIA -- logica de split + dashboard de debitos

---

### 2.8 Conciliacao Bancaria

**O que e:** Cruzamento entre transacoes registradas no sistema vs extrato real do banco.

**Fluxo:**
1. Usuario importa extrato bancario (CSV/PDF) -- ja existe
2. Sistema compara com transacoes ja registradas no periodo
3. Exibe tela de conciliacao com 3 colunas:
   - **Conciliadas:** presentes nos dois lados (match por hash)
   - **Apenas no extrato:** transacoes nao registradas (esqueceu de anotar)
   - **Apenas no sistema:** registros manuais sem correspondencia (erro ou planejado)
4. Usuario pode: aceitar, ignorar ou criar transacao a partir do extrato

**Beneficios:**
- Garante que os dados estao corretos
- Descobre transacoes esquecidas
- Identifica erros de registro

**Impacto:** ALTO -- confiabilidade dos dados e a base de tudo

**Complexidade:** MEDIA -- matching de transacoes + UX de 3 colunas

---

### 2.9 DRE Simplificado (Demonstracao de Resultado)

**O que e:** Visao de resultado financeiro no formato contabil simplificado, focado na parte PJ/empresa.

**Estrutura:**
```
(+) Receita Bruta
    Vendas / Servicos / Freelance / PJ
(-) Deducoes
    Impostos sobre receita (ISS, ICMS, PIS, COFINS)
(=) Receita Liquida
(-) Custos Diretos
    Materia-prima, terceirizados, custos de projeto
(=) Lucro Bruto
(-) Despesas Operacionais
    Aluguel, salarios, assinaturas, marketing
(=) Lucro Operacional (EBITDA simplificado)
(-) Despesas Financeiras
    Juros, taxas bancarias, IOF
(=) Resultado Liquido
```

**Visualizacao:**
- Waterfall chart (grafico cascata) mostrando cada etapa
- Comparativo com mes/trimestre/ano anterior
- Margem de lucro em destaque (%)

**Requisito:** Precisa de subcategorias ou tags para separar "custos diretos" de "despesas operacionais". Pode usar o campo `metadata` da transacao ou criar um sistema de tags.

**Impacto:** MEDIO-ALTO -- essencial para a parte empresarial

**Complexidade:** MEDIA-ALTA -- requer sistema de tags e mapeamento contabil

---

### 2.10 Relatorios Exportaveis (PDF e Excel)

**O que e:** Geracao de relatorios formatados para download.

**Tipos de relatorio:**
1. **Extrato por periodo:** Lista de transacoes com totais
2. **Resumo mensal:** Cards + graficos + insights IA
3. **Relatorio por categoria:** Detalhamento de gastos por categoria
4. **DRE:** Demonstracao de resultado (se implementada)
5. **Comparativo de periodos:** Lado a lado com variacoes

**Formatos:**
- **PDF:** Para enviar ao contador ou imprimir (usar jsPDF ou @react-pdf/renderer)
- **Excel:** Para quem quer manipular os dados (usar xlsx/exceljs)

**Impacto:** ALTO -- requisito basico para uso profissional

**Complexidade:** MEDIA -- bibliotecas existentes facilitam, porem layout de PDF exige trabalho

---

### 2.11 Multi-Moeda

**O que e:** Suporte a transacoes em moedas diferentes (USD, EUR, BRL).

**Analise:**
- Para o caso de uso atual (Germano gerenciando finanças brasileiras), multi-moeda e BAIXA prioridade.
- Poderia ser util se houver investimentos internacionais ou compras no exterior.
- Conversao de moedas exige API de cotacao (ex: exchangerate-api.com) e historico de taxas.

**Recomendacao:** Nao implementar na v1. Se necessario, adicionar campo `currency` na tabela de transacoes e contas com default `BRL`.

**Impacto:** BAIXO (para o caso de uso atual)

**Complexidade:** MEDIA-ALTA -- conversao, cotacao, exibicao

---

## 3. MATRIZ DE PRIORIZACAO: IMPACTO vs COMPLEXIDADE

### 3.1 Legenda

- **Impacto:** Quanto valor entrega ao usuario (1-5)
- **Complexidade:** Quanto esforco de desenvolvimento requer (1-5, onde 1 = simples)
- **Prioridade:** Calculada como Impacto / Complexidade (ratio)
- **Sprint Sugerido:** Em qual sprint do roadmap de 10 semanas

### 3.2 Funcionalidades do PRD (ja planejadas)

| # | Funcionalidade | Impacto | Complex. | Ratio | Sprint | Status |
|---|---|---|---|---|---|---|
| F1 | Dashboard Visual | 5 | 3 | 1.67 | Sprint 3 | OK como esta |
| F2 | Categorizacao IA | 5 | 3 | 1.67 | Sprint 4 | Melhorar com regras regex |
| F3a | Importacao CSV | 5 | 2 | 2.50 | Sprint 2 | OK como esta |
| F3b | Importacao PDF | 4 | 3 | 1.33 | Sprint 2 | OK, testar com faturas BR |
| F4 | Motor IA (resumo/forecast/anomalias) | 4 | 4 | 1.00 | Sprint 4 | OK como esta |
| F5 | Alertas e Notificacoes | 3 | 2 | 1.50 | Sprint 5 | OK como esta |
| F6 | Gestao Contas/Cartoes | 5 | 2 | 2.50 | Sprint 1 | OK como esta |

### 3.3 Novas Funcionalidades Propostas

| # | Funcionalidade | Impacto | Complex. | Ratio | Sprint Sugerido | Recomendacao |
|---|---|---|---|---|---|---|
| N1 | Regras Auto Categorizacao (regex) | 5 | 1 | **5.00** | Sprint 2 | **PRIORIDADE MAXIMA** -- facil, barato, enorme ROI |
| N2 | Comparativo entre Periodos | 4 | 1 | **4.00** | Sprint 3 | **ALTA** -- query simples, insight enorme |
| N3 | Relatorios Exportaveis (PDF/Excel) | 4 | 2 | **2.00** | Sprint 5 | **ALTA** -- essencial para uso profissional |
| N4 | Fluxo de Caixa Projetado | 5 | 3 | **1.67** | Sprint 3-4 | **ALTA** -- a funcionalidade mais valiosa |
| N5 | Indice Saude Financeira (Score) | 4 | 2 | **2.00** | Sprint 4 | **MEDIA-ALTA** -- gamificacao e motivacao |
| N6 | Metas de Economia | 4 | 2 | **2.00** | Sprint 5 | **MEDIA-ALTA** -- planejamento financeiro |
| N7 | Analise Recorrentes vs Variaveis | 4 | 3 | **1.33** | Sprint 4 | **MEDIA** -- enriquece insights da IA |
| N8 | Conciliacao Bancaria | 4 | 3 | **1.33** | Sprint 3 | **MEDIA** -- confiabilidade dos dados |
| N9 | Split de Despesas | 3 | 3 | **1.00** | Sprint 5 | **MEDIA** -- importante para multi-usuario |
| N10 | DRE Simplificado | 3 | 4 | **0.75** | Sprint 5+ | **BAIXA-MEDIA** -- util para PJ, complexo |
| N11 | Tags/Escopos PF vs PJ | 5 | 2 | **2.50** | Sprint 1-2 | **ALTA** -- estrutural, deve ser planejado cedo |
| N12 | Multi-Moeda | 2 | 4 | **0.50** | v2.0 | **BAIXA** -- nao prioritario para v1 |

### 3.4 Quadrante Visual

```
IMPACTO
  5 |  [N11]Tags     [N1]Regex    [N4]Cashflow    [F1]Dashboard
    |                [N2]Compar.                    [F2]IA Cat.
  4 |  [N3]Relat.    [N5]Score    [N7]Recorr.      [F3b]PDF
    |  [N6]Metas                  [N8]Concil.      [F4]Motor IA
  3 |               [N9]Split                       [F5]Alertas
    |
  2 |                             [N12]Moeda
    |
  1 |_______________|_____________|_____________|_____________|
    1 (Simples)      2             3             4 (Complexo)  5
                              COMPLEXIDADE

  LEGENDA DO QUADRANTE:
  Superior-Esquerdo = FAZER PRIMEIRO (alto impacto, baixa complexidade)
  Superior-Direito  = PLANEJAR BEM (alto impacto, alta complexidade)
  Inferior-Esquerdo = QUICK WINS (baixo impacto, facil de fazer)
  Inferior-Direito  = EVITAR/ADIAR (baixo impacto, alta complexidade)
```

---

## 4. ROADMAP REVISADO (Integrado ao Sprint Plan de 10 Semanas)

### Sprint 1 -- Fundacao (Semanas 1-2)
- Tudo do PRD original (auth, CRUD contas/cartoes, layout)
- **ADICIONAR:** Campo `scope` em transacoes/contas para separacao PF/PJ (tag simples, nao complexo)
- **ADICIONAR:** Tabela `categorization_rules` na migration inicial

### Sprint 2 -- Importacao (Semanas 3-4)
- Tudo do PRD original (CSV/PDF upload, parsing, duplicatas)
- **ADICIONAR:** Motor de regras regex rodando antes da IA na importacao
- **ADICIONAR:** Regras pre-configuradas para bancos/servicos brasileiros

### Sprint 3 -- Dashboard e Analises (Semanas 5-6)
- Tudo do PRD original (graficos, summary cards, filtros)
- **ADICIONAR:** Tela de comparativo entre periodos (mes vs mes)
- **ADICIONAR:** Tela de fluxo de caixa projetado (30/60/90 dias)
- **ADICIONAR:** Tela de conciliacao bancaria (3 colunas)

### Sprint 4 -- IA e Insights (Semanas 7-8)
- Tudo do PRD original (categorizacao, resumo, chat, anomalias)
- **ADICIONAR:** Indice de Saude Financeira (score 0-100)
- **ADICIONAR:** Analise de gastos fixos vs variaveis vs pontuais
- **ADICIONAR:** Insights da IA enriquecidos com dados de recorrencia

### Sprint 5 -- Polish e Extras (Semanas 9-10)
- Tudo do PRD original (alertas, orcamentos, polish, deploy)
- **ADICIONAR:** Metas de economia (savings goals)
- **ADICIONAR:** Relatorios exportaveis (PDF/Excel)
- **ADICIONAR:** Split de despesas entre membros
- **CONSIDERAR:** DRE simplificado (se houver tempo)

---

## 5. NOVAS TABELAS NECESSARIAS (Resumo)

```sql
-- 1. Regras de categorizacao automatica
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains'
    CHECK (match_type IN ('contains', 'starts_with', 'ends_with', 'regex', 'exact')),
  category_id UUID NOT NULL REFERENCES categories(id),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Metas de economia
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#10B981',
  auto_percentage DECIMAL(5,2),
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Contribuicoes para metas
CREATE TABLE savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  source TEXT DEFAULT 'manual'
    CHECK (source IN ('manual', 'auto', 'transfer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Split de despesas
CREATE TABLE transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id),
  percentage DECIMAL(5,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Alteracoes em tabelas existentes
ALTER TABLE transactions ADD COLUMN scope TEXT DEFAULT 'personal'
  CHECK (scope IN ('personal', 'business', 'shared'));
ALTER TABLE transactions ADD COLUMN is_planned BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN planned_date DATE;
ALTER TABLE accounts ADD COLUMN scope TEXT DEFAULT 'personal'
  CHECK (scope IN ('personal', 'business'));
```

---

## 6. NOVOS ENDPOINTS DE API

```
# Fluxo de Caixa
GET  /api/cashflow?days=30|60|90

# Regras de Categorizacao
GET    /api/rules
POST   /api/rules
PUT    /api/rules/:id
DELETE /api/rules/:id

# Saude Financeira
GET  /api/health-score?month=&year=

# Metas de Economia
GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id
POST   /api/goals/:id/contribute

# Comparativo
GET  /api/analytics/compare?period1_from=&period1_to=&period2_from=&period2_to=

# Conciliacao
POST /api/reconciliation/start     (upload extrato + periodo)
GET  /api/reconciliation/:id       (resultado da conciliacao)
POST /api/reconciliation/:id/apply (aplicar acoes)

# Split de Despesas
POST /api/transactions/:id/split
GET  /api/splits/balance           (saldo entre membros)

# DRE
GET  /api/reports/dre?month=&year=

# Exportacao
GET  /api/export/pdf?type=&from=&to=
GET  /api/export/excel?type=&from=&to=
```

---

## 7. RECOMENDACOES ESTRATEGICAS

### 7.1 Para a v1.0 (MVP -- 10 semanas)
Focar em: **PRD original + N1 (Regex) + N2 (Comparativo) + N4 (Cashflow) + N11 (Tags PF/PJ) + N3 (Relatorios)**

Isso entrega um produto que:
- Importa dados de qualquer banco (CSV/PDF)
- Categoriza inteligentemente (regex + IA)
- Mostra visao consolidada com graficos
- Projeta fluxo de caixa futuro
- Separa finanças pessoais de empresa
- Exporta relatorios para o contador
- Chat IA para perguntas naturais

### 7.2 Para a v1.1 (mes seguinte)
Adicionar: **N5 (Score) + N6 (Metas) + N7 (Recorrentes) + N8 (Conciliacao)**

### 7.3 Para a v2.0 (futuro)
Considerar: **N9 (Split) + N10 (DRE) + N12 (Multi-moeda) + integracao Open Banking (Pix automatico)**

### 7.4 Conselho Final
O maior risco do FinControl nao e falta de funcionalidade -- e **excesso de ambicao** na v1. As funcionalidades do PRD original ja sao ambiciosas para 10 semanas. Minha recomendacao e:

1. Garantir que o **fluxo basico funcione perfeitamente** (importar -> categorizar -> visualizar -> exportar)
2. Adicionar apenas **N1 (regex)** e **N11 (tags PF/PJ)** no Sprint 1-2 porque sao estruturais
3. As demais funcionalidades novas devem ser **planejadas na arquitetura** (tabelas, tipos) mas implementadas **conforme o ritmo permitir**

> "Um dashboard que importa CSV, categoriza bem e mostra graficos bonitos ja resolve 80% do problema do Germano. Os outros 20% podem vir depois."

---

## 8. IMPACTO NAS TABELAS EXISTENTES (Resumo de Alteracoes)

| Tabela | Alteracao | Motivo |
|---|---|---|
| `transactions` | +`scope` (personal/business/shared) | Separar PF/PJ |
| `transactions` | +`is_planned`, +`planned_date` | Fluxo de caixa projetado |
| `accounts` | +`scope` (personal/business) | Separar contas PF/PJ |
| `categories` | (sem alteracao) | Categorias ja servem para todos os escopos |
| `profiles` | (sem alteracao) | Roles ja existentes cobrem o split |

---

*Documento elaborado com base na analise do PRD v1.0, modelo de dados existente e melhores praticas de gestao financeira pessoal e empresarial no contexto brasileiro.*
