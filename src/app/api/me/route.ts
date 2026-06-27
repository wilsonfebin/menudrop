import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { credsReady } from '@/lib/utils/env'
import { DEMO_LOGIN_PHONE_COOKIE } from '@/lib/utils/demo'

export const dynamic = 'force-dynamic'

// Returns the immutable login number (account identity) — from the Supabase
// session when configured, otherwise from the demo login cookie. This is
// distinct from the editable display phone.
export async function GET() {
  if (credsReady.supabase()) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return NextResponse.json({ login_phone: session?.user?.phone ?? null })
  }

  const phone = cookies().get(DEMO_LOGIN_PHONE_COOKIE)?.value ?? null
  return NextResponse.json({ login_phone: phone })
}
