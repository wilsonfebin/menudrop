import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { Dish } from '@/types'
import { generateCaptions } from '@/lib/ai/generate'
import { checkCanPost } from '@/lib/gating'
import { credsReady } from '@/lib/utils/env'
import { DEMO_CAPTIONS } from '@/lib/utils/demo'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  let body: { restaurantName?: string; dishes?: Dish[]; platforms?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const dishes = body.dishes ?? []
  if (dishes.length === 0) {
    return NextResponse.json({ error: 'No dishes provided' }, { status: 400 })
  }

  // No OpenAI key → sample captions (keyless demo). With a key, generate for
  // real regardless of whether Supabase auth is configured.
  if (!credsReady.openai()) {
    return NextResponse.json({ captions: DEMO_CAPTIONS, demo: true })
  }

  // Only touch Supabase when it's actually configured.
  let session = null
  if (credsReady.supabase()) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    session = (await supabase.auth.getSession()).data.session
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (session) {
    const gate = await checkCanPost(session.user.id)
    if (!gate.allowed) {
      return NextResponse.json(
        { error: 'free_limit_reached', plan: gate.plan },
        { status: 402 }
      )
    }
  }

  try {
    const captions = await generateCaptions(
      body.restaurantName ?? 'Our restaurant',
      dishes
    )

    return NextResponse.json({ captions })
  } catch (error) {
    console.error('[api/ai/generate]', error)
    return NextResponse.json({ error: 'Caption generation failed' }, { status: 500 })
  }
}
