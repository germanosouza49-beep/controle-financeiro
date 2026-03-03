import { supabaseAdmin } from '../config/supabase.js'

interface PeriodSummary {
  total_income: number
  total_expense: number
  balance: number
  by_category: Array<{ category_id: string; category_name: string; total: number }>
  transaction_count: number
}

async function summarizePeriod(userId: string, from: string, to: string): Promise<PeriodSummary> {
  const { data: transactions } = await supabaseAdmin
    .from('fc_transactions')
    .select('amount, type, category_id, fc_categories(name)')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)

  let total_income = 0
  let total_expense = 0
  const catMap = new Map<string, { category_name: string; total: number }>()

  for (const t of transactions || []) {
    const amt = Number(t.amount)
    if (t.type === 'income') total_income += amt
    else total_expense += amt

    if (t.category_id) {
      const cat = t.fc_categories as unknown as { name: string } | null
      const name = cat?.name || 'Outros'
      const existing = catMap.get(t.category_id)
      if (existing) existing.total += amt
      else catMap.set(t.category_id, { category_name: name, total: amt })
    }
  }

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
    by_category: Array.from(catMap.entries())
      .map(([category_id, data]) => ({ category_id, ...data }))
      .sort((a, b) => b.total - a.total),
    transaction_count: transactions?.length || 0,
  }
}

export async function comparePeriods(
  userId: string,
  period1From: string,
  period1To: string,
  period2From: string,
  period2To: string,
) {
  const [period1, period2] = await Promise.all([
    summarizePeriod(userId, period1From, period1To),
    summarizePeriod(userId, period2From, period2To),
  ])

  // Build merged by_category for client comparison table/chart
  const allCategoryIds = new Set([
    ...period1.by_category.map(c => c.category_id),
    ...period2.by_category.map(c => c.category_id),
  ])

  const p1Map = new Map(period1.by_category.map(c => [c.category_id, c]))
  const p2Map = new Map(period2.by_category.map(c => [c.category_id, c]))

  const by_category = Array.from(allCategoryIds).map(catId => {
    const p1 = p1Map.get(catId)
    const p2 = p2Map.get(catId)
    const p1Total = p1?.total || 0
    const p2Total = p2?.total || 0
    const pctChange = p1Total > 0 ? ((p2Total - p1Total) / p1Total) * 100 : (p2Total > 0 ? 100 : 0)

    return {
      category_id: catId,
      category_name: p1?.category_name || p2?.category_name || 'Outros',
      category_color: '#6B7280',
      period1_total: p1Total,
      period2_total: p2Total,
      percentage_change: Math.round(pctChange * 10) / 10,
    }
  }).sort((a, b) => (b.period1_total + b.period2_total) - (a.period1_total + a.period2_total))

  return {
    period1: { from: period1From, to: period1To, ...period1 },
    period2: { from: period2From, to: period2To, ...period2 },
    diff: {
      income: period2.total_income - period1.total_income,
      income_pct: period1.total_income > 0
        ? ((period2.total_income - period1.total_income) / period1.total_income) * 100
        : 0,
      expense: period2.total_expense - period1.total_expense,
      expense_pct: period1.total_expense > 0
        ? ((period2.total_expense - period1.total_expense) / period1.total_expense) * 100
        : 0,
      balance: period2.balance - period1.balance,
    },
    by_category,
  }
}
