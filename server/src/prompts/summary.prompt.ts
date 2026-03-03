interface MonthlySummaryData {
  month: number
  year: number
  total_income: number
  total_expense: number
  balance: number
  by_category: Array<{ category_name: string; total: number }>
  previous_months: Array<{
    month: number
    year: number
    total_income: number
    total_expense: number
  }>
}

export function buildSummaryPrompt(data: MonthlySummaryData): string {
  return `Você é um analista financeiro pessoal. Gere um resumo mensal em português do Brasil, em linguagem natural e amigável.

Dados do mês ${String(data.month).padStart(2, '0')}/${data.year}:
- Receitas: R$ ${data.total_income.toFixed(2)}
- Despesas: R$ ${data.total_expense.toFixed(2)}
- Saldo: R$ ${data.balance.toFixed(2)}

Gastos por categoria:
${data.by_category.map(c => `- ${c.category_name}: R$ ${c.total.toFixed(2)}`).join('\n')}

Meses anteriores para comparação:
${data.previous_months.map(m => `- ${String(m.month).padStart(2, '0')}/${m.year}: Receita R$ ${m.total_income.toFixed(2)} | Despesa R$ ${m.total_expense.toFixed(2)}`).join('\n')}

Gere um resumo com:
1. Visão geral do mês (saldo positivo/negativo, como foi comparado aos meses anteriores)
2. Destaques de gastos (maiores categorias)
3. Tendências observadas
4. Dica financeira personalizada

Use formato Markdown. Seja conciso mas informativo.`
}
