interface ForecastData {
  historical: Array<{
    month: number
    year: number
    total_income: number
    total_expense: number
    by_category: Array<{ category_name: string; total: number }>
  }>
  recurring: Array<{
    description: string
    amount: number
    type: string
  }>
}

export function buildForecastPrompt(data: ForecastData): string {
  return `Você é um analista financeiro. Projete os próximos 3 meses com base nos dados históricos.

Histórico dos últimos 6 meses:
${JSON.stringify(data.historical, null, 2)}

Transações recorrentes:
${JSON.stringify(data.recurring, null, 2)}

Retorne APENAS um JSON array válido, sem markdown, com projeção para os próximos 3 meses:
[{
  "month": 4,
  "year": 2026,
  "projected_income": { "optimistic": 8000, "realistic": 7500, "pessimistic": 7000 },
  "projected_expense": { "optimistic": 5000, "realistic": 5500, "pessimistic": 6000 },
  "reasoning": "Explicação da projeção"
}]

Considere:
- Tendências de crescimento/redução de gastos
- Sazonalidade (ex: dezembro tem mais gastos)
- Transações recorrentes confirmadas
- Otimista = menor gasto, maior receita; Pessimista = inverso`
}
