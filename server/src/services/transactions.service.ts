import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'

export function generateImportHash(date: string, amount: number, description: string): string {
  return crypto.createHash('sha256').update(`${date}${amount}${description}`).digest('hex')
}

interface TransactionFilters {
  page: number
  limit: number
  category?: string
  type?: string
  from?: string
  to?: string
  account_id?: string
  card_id?: string
  search?: string
}

export async function listTransactions(userId: string, filters: TransactionFilters) {
  const { page, limit } = filters
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('fc_transactions')
    .select('*, fc_categories(name, icon, color)', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.category) query = query.eq('category_id', filters.category)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.from) query = query.gte('date', filters.from)
  if (filters.to) query = query.lte('date', filters.to)
  if (filters.account_id) query = query.eq('account_id', filters.account_id)
  if (filters.card_id) query = query.eq('card_id', filters.card_id)
  if (filters.search) query = query.ilike('description', `%${filters.search}%`)

  const { data, error, count } = await query

  if (error) throw error
  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

export async function createTransaction(userId: string, input: {
  account_id?: string | null
  card_id?: string | null
  category_id?: string | null
  amount: number
  type: string
  description: string
  date: string
  is_recurring?: boolean
  recurrence_rule?: string | null
  installment_current?: number | null
  installment_total?: number | null
}) {
  const import_hash = generateImportHash(input.date, input.amount, input.description)

  const { data, error } = await supabaseAdmin
    .from('fc_transactions')
    .insert({
      ...input,
      user_id: userId,
      import_source: 'manual',
      import_hash,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTransaction(userId: string, transactionId: string, input: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('fc_transactions')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const { error } = await supabaseAdmin
    .from('fc_transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getTransactionSummary(
  userId: string,
  from: string,
  to: string,
  accountId?: string,
  cardId?: string,
) {
  // --- Current period ---
  let query = supabaseAdmin
    .from('fc_transactions')
    .select('amount, type, category_id, fc_categories(name, icon, color)')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)

  if (accountId) query = query.eq('account_id', accountId)
  if (cardId) query = query.eq('card_id', cardId)

  const { data: transactions, error } = await query
  if (error) throw error

  let total_income = 0
  let total_expense = 0
  const categoryTotals = new Map<string, { category_name: string; category_icon: string; category_color: string; total: number }>()

  for (const t of transactions || []) {
    const amt = Number(t.amount)
    if (t.type === 'income') {
      total_income += amt
    } else {
      total_expense += amt
    }

    const cat = t.fc_categories as unknown as { name: string; icon: string; color: string } | null
    const catId = t.category_id || '__uncategorized'
    const existing = categoryTotals.get(catId)
    if (existing) {
      existing.total += amt
    } else {
      categoryTotals.set(catId, {
        category_name: cat?.name || 'Sem categoria',
        category_icon: cat?.icon || 'circle',
        category_color: cat?.color || '#94a3b8',
        total: amt,
      })
    }
  }

  const totalExpenseForPct = total_expense || 1
  const by_category = Array.from(categoryTotals.entries()).map(([category_id, d]) => ({
    category_id,
    category_name: d.category_name,
    category_icon: d.category_icon,
    category_color: d.category_color,
    total: d.total,
    percentage: Math.round((d.total / totalExpenseForPct) * 100),
  }))

  // --- Previous period (same duration, immediately before) ---
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const durationMs = toDate.getTime() - fromDate.getTime()
  const prevTo = new Date(fromDate.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - durationMs)
  const prevFromStr = prevFrom.toISOString().slice(0, 10)
  const prevToStr = prevTo.toISOString().slice(0, 10)

  let prevQuery = supabaseAdmin
    .from('fc_transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('date', prevFromStr)
    .lte('date', prevToStr)

  if (accountId) prevQuery = prevQuery.eq('account_id', accountId)
  if (cardId) prevQuery = prevQuery.eq('card_id', cardId)

  const { data: prevTx } = await prevQuery
  let prev_income = 0
  let prev_expense = 0
  for (const t of prevTx || []) {
    if (t.type === 'income') prev_income += Number(t.amount)
    else prev_expense += Number(t.amount)
  }

  const income_change_pct = prev_income ? ((total_income - prev_income) / prev_income) * 100 : 0
  const expense_change_pct = prev_expense ? ((total_expense - prev_expense) / prev_expense) * 100 : 0

  // --- Trends (last 6 months) ---
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const trendsFromStr = sixMonthsAgo.toISOString().slice(0, 10)

  const { data: trendTx } = await supabaseAdmin
    .from('fc_transactions')
    .select('amount, type, date')
    .eq('user_id', userId)
    .gte('date', trendsFromStr)
    .lte('date', to)

  const monthlyMap = new Map<string, { income: number; expense: number }>()
  for (const t of trendTx || []) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    const entry = monthlyMap.get(key) || { income: 0, expense: 0 }
    if (t.type === 'income') entry.income += Number(t.amount)
    else entry.expense += Number(t.amount)
    monthlyMap.set(key, entry)
  }

  const trends = Array.from(monthlyMap.entries())
    .map(([key, v]) => {
      const [y, m] = key.split('-').map(Number)
      return { month: m, year: y, income: v.income, expense: v.expense }
    })
    .sort((a, b) => a.year - b.year || a.month - b.month)

  // --- Recent transactions ---
  let recentQuery = supabaseAdmin
    .from('fc_transactions')
    .select('*, fc_categories(name, icon, color)')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(10)

  if (accountId) recentQuery = recentQuery.eq('account_id', accountId)
  if (cardId) recentQuery = recentQuery.eq('card_id', cardId)

  const { data: recentTx } = await recentQuery

  return {
    summary: {
      total_income,
      total_expense,
      balance: total_income - total_expense,
      by_category,
      vs_previous_month: {
        income_change_pct: Math.round(income_change_pct * 10) / 10,
        expense_change_pct: Math.round(expense_change_pct * 10) / 10,
      },
    },
    trends,
    recent_transactions: recentTx || [],
  }
}

export async function findDuplicateHashes(userId: string, hashes: string[]): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('fc_transactions')
    .select('import_hash')
    .eq('user_id', userId)
    .in('import_hash', hashes)

  if (error) throw error
  return new Set((data || []).map(d => d.import_hash).filter(Boolean) as string[])
}
