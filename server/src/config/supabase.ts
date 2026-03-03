import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client — bypasses RLS. Use only server-side.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Per-request client that uses the user's JWT for RLS enforcement
export function createUserClient(accessToken: string) {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
