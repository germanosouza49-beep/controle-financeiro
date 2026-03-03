interface SuggestionsData {
  monthly_by_category: Array<{
    category_name: string
    months: Array<{ month: number; year: number; total: number }>
  }>
  recurring_transactions: Array<{
    description: string
    amount: number
    frequency: string
  }>
}

export function buildSuggestionsPrompt(data: SuggestionsData): string {
  return `Você é um consultor financeiro pessoal. Analise os dados e sugira cortes de gastos em português do Brasil.

Gastos mensais por categoria (últimos 6 meses):
${JSON.stringify(data.monthly_by_category, null, 2)}

Transações recorrentes identificadas:
${JSON.stringify(data.recurring_transactions, null, 2)}

Retorne APENAS um JSON array válido, sem markdown:
[{
  "title": "Título da sugestão",
  "description": "Explicação detalhada",
  "estimated_savings": 150.00,
  "category": "Nome da categoria",
  "priority": "high|medium|low"
}]

Busque:
- Assinaturas duplicadas ou pouco usadas
- Categorias com gastos crescentes
- Oportunidades de economia com alternativas mais baratas
- Gastos que podem ser reduzidos ou eliminados`
}
