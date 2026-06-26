import { NextResponse } from 'next/server'
import { DEMO_SESSION_COOKIE, DEMO_PROFILE_COOKIE } from '@/lib/utils/demo'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(DEMO_SESSION_COOKIE)
  res.cookies.delete(DEMO_PROFILE_COOKIE)
  return res
}
