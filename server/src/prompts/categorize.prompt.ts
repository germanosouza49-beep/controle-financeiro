interface CategoryInfo {
  id: string
  name: string
  type: string
}

interface TransactionInfo {
  id: string
  description: string
  amount: number
  type: string
}

export function buildCategorizePrompt(
  categories: CategoryInfo[],
  transactions: TransactionInfo[],
  corrections: Array<{ description: string; category_name: string }>,
): string {
  const categoriesJson = JSON.stringify(categories.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
  })))

  const correctionsJson = corrections.length > 0
    ? JSON.stringify(corrections)
    : '[]'

  const transactionsJson = JSON.stringify(transactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    type: t.type,
  })))

  return `Você é um assistente financeiro especializado em categorizar transações bancárias brasileiras.

Categorias disponíveis:
${categoriesJson}

Histórico de correções do usuário (use para aprender preferências):
${correctionsJson}

Transações para categorizar:
${transactionsJson}

Para cada transação, retorne APENAS um JSON array válido, sem markdown:
[{"id": "...", "category_id": "...", "confidence": 0.95, "reasoning": "..."}]

Regras:
- Use APENAS category_ids da lista de categorias disponíveis
- Combine o type da transação (income/expense) com o type da categoria
- confidence deve refletir sua certeza real (0.0 a 1.0)
- Considere contexto brasileiro: PIX, boletos, Nubank, iFood, 99, Uber, Mercado Livre, etc.
- Se a descrição for ambígua, dê confidence menor`
}
