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

export async function getTransactionSummary(userId: string, month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data: transactions, error } = await supabaseAdmin
    .from('fc_transactions')
    .select('amount, type, category_id, fc_categories(name)')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lt('date', endDate)

  if (error) throw error

  let total_income = 0
  let total_expense = 0
  const categoryTotals = new Map<string, { category_name: string; total: number }>()

  for (const t of transactions || []) {
    if (t.type === 'income') {
      total_income += Number(t.amount)
    } else {
      total_expense += Number(t.amount)
    }

    if (t.category_id) {
      const existing = categoryTotals.get(t.category_id)
      const cat = t.fc_categories as unknown as { name: string } | null
      const catName = cat?.name || 'Sem categoria'
      if (existing) {
        existing.total += Number(t.amount)
      } else {
        categoryTotals.set(t.category_id, { category_name: catName, total: Number(t.amount) })
      }
    }
  }

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
    by_category: Array.from(categoryTotals.entries()).map(([category_id, data]) => ({
      category_id,
      category_name: data.category_name,
      total: data.total,
    })),
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
