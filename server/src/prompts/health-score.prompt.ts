interface HealthScoreData {
  total_income: number
  total_expense: number
  savings_rate: number
  budget_adherence: number
  debt_ratio: number
  emergency_fund_months: number
  category_breakdown: Array<{ name: string; total: number; pct: number }>
}

export function buildHealthScorePrompt(data: HealthScoreData): string {
  return `Voce e um consultor financeiro pessoal. Calcule um score de saude financeira de 0 a 100 e forneca dicas.

Dados do usuario (mes atual):
- Receita: R$ ${data.total_income.toFixed(2)}
- Despesa: R$ ${data.total_expense.toFixed(2)}
- Taxa de poupanca: ${data.savings_rate.toFixed(1)}%
- Aderencia ao orcamento: ${data.budget_adherence.toFixed(1)}%
- Ratio divida/receita: ${data.debt_ratio.toFixed(1)}%
- Reserva de emergencia: ${data.emergency_fund_months.toFixed(1)} meses

Distribuicao de gastos:
${data.category_breakdown.map(c => `- ${c.name}: R$ ${c.total.toFixed(2)} (${c.pct.toFixed(1)}%)`).join('\n')}

Retorne APENAS um JSON valido, sem markdown:
{
  "score": 75,
  "grade": "B+",
  "summary": "Resumo em 1-2 frases",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "improvements": ["Melhoria 1", "Melhoria 2"],
  "tips": ["Dica pratica 1", "Dica pratica 2"]
}

Criterios de pontuacao:
- Taxa de poupanca >= 20%: +25 pontos
- Aderencia ao orcamento >= 90%: +20 pontos
- Ratio divida/receita < 30%: +20 pontos
- Reserva emergencia >= 6 meses: +20 pontos
- Diversificacao de gastos saudavel: +15 pontos`
}
