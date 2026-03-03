import { supabaseAdmin } from '../config/supabase.js'

export async function createSplit(
  userId: string,
  transactionId: string,
  splits: Array<{ member_id: string; percentage: number }>,
) {
  // Verify transaction ownership
  const { data: tx, error: txErr } = await supabaseAdmin
    .from('fc_transactions')
    .select('id, amount')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .single()

  if (txErr || !tx) throw new Error('Transaction not found')

  const totalPct = splits.reduce((sum, s) => sum + s.percentage, 0)
  if (Math.abs(totalPct - 100) > 0.01) {
    throw new Error('Split percentages must sum to 100')
  }

  const totalAmount = Number(tx.amount)
  const rows = splits.map(s => ({
    transaction_id: transactionId,
    member_id: s.member_id,
    percentage: s.percentage,
    amount: (totalAmount * s.percentage) / 100,
  }))

  const { data, error } = await supabaseAdmin
    .from('fc_transaction_splits')
    .insert(rows)
    .select()

  if (error) throw error
  return data
}

export async function getSplitBalance(userId: string) {
  // Amount this user owes to others
  const { data: owedByMe } = await supabaseAdmin
    .from('fc_transaction_splits')
    .select('member_id, amount, is_settled, fc_transactions(user_id)')
    .eq('member_id', userId)
    .eq('is_settled', false)

  // Amount others owe to this user
  const { data: owedToMe } = await supabaseAdmin
    .from('fc_transaction_splits')
    .select('member_id, amount, is_settled, fc_transactions!inner(user_id)')
    .eq('fc_transactions.user_id', userId)
    .eq('is_settled', false)
    .neq('member_id', userId)

  const balances = new Map<string, number>()

  // I owe these amounts (negative from my perspective)
  for (const split of owedByMe || []) {
    const owner = (split.fc_transactions as unknown as { user_id: string } | null)?.user_id
    if (owner && owner !== userId) {
      const current = balances.get(owner) || 0
      balances.set(owner, current - Number(split.amount))
    }
  }

  // Others owe me these amounts (positive from my perspective)
  for (const split of owedToMe || []) {
    const current = balances.get(split.member_id) || 0
    balances.set(split.member_id, current + Number(split.amount))
  }

  return Array.from(balances.entries()).map(([member_id, net_amount]) => ({
    member_id,
    net_amount,
    direction: net_amount > 0 ? 'they_owe_me' : 'i_owe_them',
  }))
}
