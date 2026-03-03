import { supabaseAdmin } from '../config/supabase.js'

export async function listBudgets(userId: string, month?: number, year?: number) {
  let query = supabaseAdmin
    .from('fc_budgets')
    .select('*, fc_categories(name, icon, color)')
    .eq('user_id', userId)

  if (month) query = query.eq('month', month)
  if (year) query = query.eq('year', year)

  const { data, error } = await query.order('year').order('month')

  if (error) throw error

  // Compute spent/remaining for each budget to return BudgetStatus[]
  const budgetStatuses = await Promise.all(
    (data || []).map(async (row) => {
      const cat = row.fc_categories as unknown as { name: string; icon: string; color: string } | null
      const startDate = `${row.year}-${String(row.month).padStart(2, '0')}-01`
      const endDate = row.month === 12
        ? `${row.year + 1}-01-01`
        : `${row.year}-${String(row.month + 1).padStart(2, '0')}-01`

      const { data: txData } = await supabaseAdmin
        .from('fc_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category_id', row.category_id)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lt('date', endDate)

      const spent = (txData || []).reduce((sum, t) => sum + Number(t.amount), 0)
      const remaining = row.limit_amount - spent
      const percentage = row.limit_amount > 0 ? (spent / row.limit_amount) * 100 : 0

      return {
        budget: row,
        category_name: cat?.name || 'Sem categoria',
        category_icon: cat?.icon || 'tag',
        category_color: cat?.color || '#6B7280',
        spent,
        percentage,
        remaining,
      }
    })
  )

  return budgetStatuses
}

export async function createBudget(userId: string, input: {
  category_id: string
  month: number
  year: number
  limit_amount: number
  alert_threshold: number
}) {
  const { data, error } = await supabaseAdmin
    .from('fc_budgets')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBudget(userId: string, budgetId: string, input: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('fc_budgets')
    .update(input)
    .eq('id', budgetId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBudget(userId: string, budgetId: string) {
  const { error } = await supabaseAdmin
    .from('fc_budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', userId)

  if (error) throw error
}
