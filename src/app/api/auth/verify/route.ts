import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { isDemoMode } from '@/lib/utils/env'
import { normalisePhone } from '@/lib/auth/otp'
import { DEMO_SESSION_COOKIE, DEMO_LOGIN_PHONE_COOKIE } from '@/lib/utils/demo'

export async function POST(req: NextRequest) {
  let body: { phone?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const phone = body.phone ? normalisePhone(body.phone) : ''
  const code = body.code?.trim() ?? ''
  if (!phone || !code) {
    return NextResponse.json({ error: 'Phone and code required' }, { status: 400 })
  }

  // ── Demo mode: accept 000000 and set a demo session cookie ──────────
  if (isDemoMode()) {
    if (code === '000000') {
      const res = NextResponse.json({
        verified: true,
        demo: true,
        needsOnboarding: true,
      })
      const cookieOpts = {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      }
      res.cookies.set(DEMO_SESSION_COOKIE, '1', cookieOpts)
      // Persist the login number so it stays fixed (separate from the editable
      // display phone).
      res.cookies.set(DEMO_LOGIN_PHONE_COOKIE, phone.slice(-10), cookieOpts)
      return res
    }
    return NextResponse.json({ error: 'Demo mode: use code 000000' }, { status: 401 })
  }

  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+${phone}`,
    token: code,
    type: 'sms',
  })
  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? 'Invalid code' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('restaurant_profiles')
    .select('id')
    .eq('user_id', data.session.user.id)
    .maybeSingle()

  return NextResponse.json({ verified: true, needsOnboarding: !profile })
}
