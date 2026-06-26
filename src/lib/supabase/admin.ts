import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let cached: SupabaseClient<Database> | null = null

// Admin client — only use in API routes / server code, never in the browser.
// Bypasses Row-Level Security via the service-role key. Created lazily so the
// production build (which runs with no env) never instantiates it.
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!cached) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin not configured')
    cached = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cached
}
