import { supabaseAdmin } from '../config/supabase.js'

export async function listRules(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_categorization_rules')
    .select('*, fc_categories(name, icon, color)')
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (error) throw error
  return data
}

export async function createRule(userId: string, input: {
  pattern: string
  match_type: string
  category_id: string
  priority: number
}) {
  const { data, error } = await supabaseAdmin
    .from('fc_categorization_rules')
    .insert({ ...input, user_id: userId, is_system: false })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRule(userId: string, ruleId: string, input: Record<string, unknown>) {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('fc_categorization_rules')
    .select('is_system, user_id')
    .eq('id', ruleId)
    .single()

  if (fetchErr || !existing) throw new Error('Rule not found')
  if (existing.is_system) throw new Error('Cannot modify system rules')
  if (existing.user_id !== userId) throw new Error('Rule not found')

  const { data, error } = await supabaseAdmin
    .from('fc_categorization_rules')
    .update(input)
    .eq('id', ruleId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRule(userId: string, ruleId: string) {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('fc_categorization_rules')
    .select('is_system, user_id')
    .eq('id', ruleId)
    .single()

  if (fetchErr || !existing) throw new Error('Rule not found')
  if (existing.is_system) throw new Error('Cannot delete system rules')
  if (existing.user_id !== userId) throw new Error('Rule not found')

  const { error } = await supabaseAdmin
    .from('fc_categorization_rules')
    .delete()
    .eq('id', ruleId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Apply deterministic rules to a transaction description.
 * Returns the matched category_id or null.
 */
export async function applyRules(userId: string, description: string): Promise<string | null> {
  const { data: rules } = await supabaseAdmin
    .from('fc_categorization_rules')
    .select('pattern, match_type, category_id')
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (!rules) return null

  const descUpper = description.toUpperCase()

  for (const rule of rules) {
    const pattern = rule.pattern.toUpperCase()
    let matched = false

    switch (rule.match_type) {
      case 'contains':
        matched = descUpper.includes(pattern)
        break
      case 'starts_with':
        matched = descUpper.startsWith(pattern)
        break
      case 'ends_with':
        matched = descUpper.endsWith(pattern)
        break
      case 'exact':
        matched = descUpper === pattern
        break
      case 'regex':
        try {
          matched = new RegExp(rule.pattern, 'i').test(description)
        } catch {
          matched = false
        }
        break
    }

    if (matched) return rule.category_id
  }

  return null
}
