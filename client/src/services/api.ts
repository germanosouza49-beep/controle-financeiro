import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || ''

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeaders = await getAuthHeaders()
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...authHeaders,
    ...(options.headers as Record<string, string> || {}),
  }
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || 'Request failed')
  }
  return res.json()
}
