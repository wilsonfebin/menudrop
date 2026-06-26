import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Admin client — only use in API routes / server code, never in the browser.
// Bypasses Row-Level Security via the service-role key.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
