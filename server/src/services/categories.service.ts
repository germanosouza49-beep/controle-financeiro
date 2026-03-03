import { supabaseAdmin } from '../config/supabase.js'

export async function listCategories(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_categories')
    .select('*')
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order('name')

  if (error) throw error
  return data
}

export async function createCategory(userId: string, input: {
  name: string
  icon: string
  color: string
  type: string
}) {
  const { data, error } = await supabaseAdmin
    .from('fc_categories')
    .insert({ ...input, user_id: userId, is_system: false })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(userId: string, categoryId: string, input: Record<string, unknown>) {
  // Verify it's the user's own category, not a system one
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('fc_categories')
    .select('is_system, user_id')
    .eq('id', categoryId)
    .single()

  if (fetchError || !existing) throw new Error('Category not found')
  if (existing.is_system) throw new Error('Cannot modify system categories')
  if (existing.user_id !== userId) throw new Error('Category not found')

  const { data, error } = await supabaseAdmin
    .from('fc_categories')
    .update(input)
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(userId: string, categoryId: string) {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('fc_categories')
    .select('is_system, user_id')
    .eq('id', categoryId)
    .single()

  if (fetchError || !existing) throw new Error('Category not found')
  if (existing.is_system) throw new Error('Cannot delete system categories')
  if (existing.user_id !== userId) throw new Error('Category not found')

  const { error } = await supabaseAdmin
    .from('fc_categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId)

  if (error) throw error
}
