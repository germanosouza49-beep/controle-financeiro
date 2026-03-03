import { supabaseAdmin } from '../config/supabase.js'

export async function listNotifications(userId: string, isRead?: boolean) {
  let query = supabaseAdmin
    .from('fc_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (isRead !== undefined) {
    query = query.eq('is_read', isRead)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function markAsRead(userId: string, notificationId: string) {
  const { data, error } = await supabaseAdmin
    .from('fc_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabaseAdmin
    .from('fc_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

export async function createNotification(userId: string, input: {
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const { data, error } = await supabaseAdmin
    .from('fc_notifications')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}
