import { supabaseAdmin } from '../config/supabase.js'

export async function listAccounts(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createAccount(userId: string, input: {
  bank_name: string
  account_type: string
  balance: number
  color: string
  icon: string
  scope: string
}) {
  const { data, error } = await supabaseAdmin
    .from('fc_accounts')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAccount(userId: string, accountId: string, input: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('fc_accounts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', accountId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAccount(userId: string, accountId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_accounts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', accountId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
