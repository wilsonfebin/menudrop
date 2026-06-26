import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

// Placeholder fallbacks keep the production build from throwing when env is
// absent at build time. Real NEXT_PUBLIC_* values are inlined at build via
// docker build args (see Dockerfile / DEPLOY.md).
export const supabase = createClientComponentClient<Database>({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
})
