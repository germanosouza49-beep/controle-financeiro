import { supabaseAdmin } from '../config/supabase.js'

export async function listCards(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_credit_cards')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createCard(userId: string, input: {
  card_name: string
  last_digits: string
  credit_limit: number
  closing_day: number
  due_day: number
  color: string
}) {
  const { data, error } = await supabaseAdmin
    .from('fc_credit_cards')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCard(userId: string, cardId: string, input: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('fc_credit_cards')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCard(userId: string, cardId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_credit_cards')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
