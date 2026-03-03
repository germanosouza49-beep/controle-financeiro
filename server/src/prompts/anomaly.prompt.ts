interface AnomalyData {
  recent_transactions: Array<{
    id: string
    description: string
    amount: number
    date: string
    category_name: string
  }>
  category_averages: Array<{
    category_name: string
    avg_amount: number
    std_dev: number
  }>
}

export function buildAnomalyPrompt(data: AnomalyData): string {
  return `Você é um detector de fraudes e anomalias financeiras. Analise as transações recentes comparando com os padrões históricos.

Transações recentes (último mês):
${JSON.stringify(data.recent_transactions, null, 2)}

Médias e desvio padrão por categoria (últimos 3 meses):
${JSON.stringify(data.category_averages, null, 2)}

Retorne APENAS um JSON array válido, sem markdown, com anomalias detectadas:
[{
  "transaction_id": "...",
  "description": "...",
  "amount": 500.00,
  "reason": "Valor 3x acima da média para esta categoria",
  "severity": "high|medium|low",
  "category": "Nome da categoria"
}]

Critérios de anomalia:
- Valor 2x+ acima da média da categoria
- Transações duplicadas (mesmo valor e descrição em período curto)
- Picos súbitos em categorias estáveis
- Se não houver anomalias, retorne array vazio []`
}
