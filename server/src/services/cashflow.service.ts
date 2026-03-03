import { supabaseAdmin } from '../config/supabase.js'

export async function projectCashflow(userId: string, days: number) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // Get current balances
  const { data: accounts } = await supabaseAdmin
    .from('fc_accounts')
    .select('id, bank_name, balance')
    .eq('user_id', userId)
    .eq('is_active', true)

  const currentBalance = (accounts || []).reduce((sum, a) => sum + Number(a.balance), 0)

  // Get planned/recurring transactions
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10)

  const { data: planned } = await supabaseAdmin
    .from('fc_transactions')
    .select('amount, type, date, planned_date, description')
    .eq('user_id', userId)
    .eq('is_planned', true)
    .gte('planned_date', todayStr)
    .lte('planned_date', futureDate)

  // Get recurring templates
  const { data: templates } = await supabaseAdmin
    .from('fc_recurring_templates')
    .select('amount, type, description, frequency, day_of_month')
    .eq('user_id', userId)
    .eq('is_active', true)

  // Build daily projection
  const projection: Array<{
    date: string
    balance: number
    income: number
    expense: number
    events: Array<{ description: string; amount: number; type: string }>
  }> = []

  let runningBalance = currentBalance

  for (let d = 0; d < days; d++) {
    const date = new Date(today.getTime() + d * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().slice(0, 10)
    const dayOfMonth = date.getDate()

    let dayIncome = 0
    let dayExpense = 0
    const events: Array<{ description: string; amount: number; type: string }> = []

    // Planned transactions for this date
    for (const tx of planned || []) {
      if ((tx.planned_date || tx.date) === dateStr) {
        const amt = Number(tx.amount)
        if (tx.type === 'income') dayIncome += amt
        else dayExpense += amt
        events.push({ description: tx.description, amount: amt, type: tx.type })
      }
    }

    // Monthly recurring on this day
    for (const tmpl of templates || []) {
      if (tmpl.frequency === 'monthly' && tmpl.day_of_month === dayOfMonth) {
        const amt = Number(tmpl.amount)
        if (tmpl.type === 'income') dayIncome += amt
        else dayExpense += amt
        events.push({ description: tmpl.description, amount: amt, type: tmpl.type })
      }
    }

    runningBalance += dayIncome - dayExpense
    projection.push({
      date: dateStr,
      balance: runningBalance,
      income: dayIncome,
      expense: dayExpense,
      events,
    })
  }

  // Find lowest balance point
  let lowestBalance = currentBalance
  let lowestBalanceDate = todayStr
  for (const p of projection) {
    if (p.balance < lowestBalance) {
      lowestBalance = p.balance
      lowestBalanceDate = p.date
    }
  }

  // Map projection to client-expected format (days with projected_balance)
  const daysOutput = projection.map(p => ({
    ...p,
    projected_balance: p.balance,
  }))

  return {
    starting_balance: currentBalance,
    ending_balance: runningBalance,
    lowest_balance: lowestBalance,
    lowest_balance_date: lowestBalanceDate,
    days: daysOutput,
  }
}
