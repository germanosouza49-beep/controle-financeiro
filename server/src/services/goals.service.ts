import { supabaseAdmin } from '../config/supabase.js'

export async function listGoals(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_savings_goals')
    .select('*, fc_savings_contributions(id, amount, source, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createGoal(userId: string, input: {
  name: string
  target_amount: number
  deadline?: string | null
  icon?: string
  color?: string
  auto_percentage?: number | null
}) {
  const { data, error } = await supabaseAdmin
    .from('fc_savings_goals')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateGoal(userId: string, goalId: string, input: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('fc_savings_goals')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteGoal(userId: string, goalId: string) {
  const { error } = await supabaseAdmin
    .from('fc_savings_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function contribute(userId: string, goalId: string, amount: number, source: string) {
  // Verify goal ownership
  const { data: goal, error: goalErr } = await supabaseAdmin
    .from('fc_savings_goals')
    .select('id, current_amount, target_amount')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single()

  if (goalErr || !goal) throw new Error('Goal not found')

  // Insert contribution
  const { data: contribution, error: contribErr } = await supabaseAdmin
    .from('fc_savings_contributions')
    .insert({ goal_id: goalId, amount, source })
    .select()
    .single()

  if (contribErr) throw contribErr

  // Update current_amount on goal
  const newAmount = Number(goal.current_amount) + amount
  const isCompleted = newAmount >= Number(goal.target_amount)

  await supabaseAdmin
    .from('fc_savings_goals')
    .update({
      current_amount: newAmount,
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)

  return contribution
}
