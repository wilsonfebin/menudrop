import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { isDemoMode } from '@/lib/utils/env'
import { DEMO_PROFILE_COOKIE } from '@/lib/utils/demo'

// In demo mode the profile is stored in a cookie so the dashboard,
// onboarding and settings screens all work without a database.
function demoProfile() {
  const raw = cookies().get(DEMO_PROFILE_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(demoProfile())
  }

  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('restaurant_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 })
  }

  // ── Demo mode: persist the profile in a cookie ──────────────────────
  if (isDemoMode()) {
    const now = new Date().toISOString()
    const profile = {
      id: 'demo',
      user_id: 'demo',
      logo_url: null,
      logo_public_id: null,
      street: null,
      maps_link: null,
      location_name: null,
      business_hours: null,
      caption_language: 'both',
      brand_color: '#185FA5',
      city: null,
      display_phone: null,
      ...body,
      created_at: now,
      updated_at: now,
    }
    const res = NextResponse.json(profile)
    res.cookies.set(DEMO_PROFILE_COOKIE, JSON.stringify(profile), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
    return res
  }

  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = { ...body, user_id: session.user.id }
  const { data, error } = await supabase
    .from('restaurant_profiles')
    .upsert(payload as never, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
