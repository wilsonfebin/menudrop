import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'
import { isDemoMode } from '@/lib/utils/env'
import { DEMO_SESSION_COOKIE } from '@/lib/utils/demo'

const PUBLIC_PATHS = ['/login', '/verify', '/api/auth', '/api/config', '/api/diag']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isRoot = pathname === '/'
  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/verify') || isRoot

  // ── Demo mode ──────────────────────────────────────────────────────
  // Supabase isn't configured, so don't construct a real client (it would
  // throw). Use a lightweight demo cookie as the "session" instead.
  if (isDemoMode()) {
    const hasDemoSession = req.cookies.get(DEMO_SESSION_COOKIE)?.value === '1'
    if (!hasDemoSession && !isPublic) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (hasDemoSession && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── Real Supabase session ──────────────────────────────────────────
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)',
  ],
}
