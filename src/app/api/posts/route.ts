import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type {
  BackgroundOption,
  Dish,
  FomoContent,
  ImageFormat,
  PostCaptions,
  SpecialsTemplate,
} from '@/types'
import { isDemoMode, credsReady } from '@/lib/utils/env'
import { uploadSpecials } from '@/lib/cloudinary'

export const maxDuration = 30

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ posts: [] })
  }

  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('post_history')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ posts: data ?? [] })
}

// Create a post record when the user shares/saves an image. Persists the
// rendered image to Cloudinary (when configured) so the dashboard grid shows
// the exact poster and it can be reused.
export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    // Demo mode has no database — accept silently so the UI flow works.
    return NextResponse.json({ ok: true, demo: true })
  }

  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    kind?: 'special' | 'fomo'
    dishes?: Dish[]
    fomo?: FomoContent
    captions?: PostCaptions
    background?: BackgroundOption
    format?: ImageFormat
    template?: SpecialsTemplate
    platforms?: string[]
    image_data?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const kind = body.kind === 'fomo' ? 'fomo' : 'special'
  if (!body.captions) {
    return NextResponse.json({ error: 'Missing captions' }, { status: 400 })
  }
  if (kind === 'special' && (!body.dishes || body.dishes.length === 0)) {
    return NextResponse.json({ error: 'Missing dishes' }, { status: 400 })
  }
  if (kind === 'fomo' && !body.fomo) {
    return NextResponse.json({ error: 'Missing update content' }, { status: 400 })
  }

  let image_url: string | null = null
  if (body.image_data && credsReady.cloudinary()) {
    try {
      const up = await uploadSpecials(body.image_data, session.user.id)
      image_url = up.url
    } catch (e) {
      console.error('[api/posts] image upload failed', e)
    }
  }

  const { data, error } = await supabase
    .from('post_history')
    .insert({
      user_id: session.user.id,
      kind,
      dishes: body.dishes ?? [],
      fomo: (body.fomo ?? null) as never,
      captions: body.captions,
      background: (body.background ?? null) as never,
      format: body.format ?? null,
      template: body.template ?? 'classic',
      image_url,
      platform_used: body.platforms ?? [],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ post: data })
}
