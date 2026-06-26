import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { isDemoMode } from '@/lib/utils/env'
import { normalisePhone } from '@/lib/auth/otp'

export async function POST(req: NextRequest) {
  let body: { phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const phone = body.phone ? normalisePhone(body.phone) : ''
  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
  }

  if (isDemoMode()) {
    // Allow the UI to proceed in demo mode without a live backend.
    return NextResponse.json({
      sent: true,
      demo: true,
      message: 'Demo mode: use code 000000 to continue.',
    })
  }

  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { error } = await supabase.auth.signInWithOtp({ phone: `+${phone}` })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 })
  }
  return NextResponse.json({ sent: true })
}
