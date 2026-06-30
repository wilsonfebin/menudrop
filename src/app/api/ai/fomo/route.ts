import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { FomoContent, LangCode } from '@/types'
import { SECOND_LANGUAGES } from '@/types'
import { generateFomoCaptions } from '@/lib/ai/fomo'
import { credsReady } from '@/lib/utils/env'
import { DEMO_FOMO_CAPTIONS } from '@/lib/utils/demo'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  let body: { restaurantName?: string; content?: FomoContent; language?: LangCode }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.content || !body.content.template) {
    return NextResponse.json({ error: 'No update content provided' }, { status: 400 })
  }

  const lang: LangCode = SECOND_LANGUAGES.includes(body.language as LangCode)
    ? (body.language as LangCode)
    : 'ml'

  // No OpenAI key → sample captions (keyless demo).
  if (!credsReady.openai()) {
    return NextResponse.json({ captions: DEMO_FOMO_CAPTIONS, demo: true })
  }

  if (credsReady.supabase()) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const captions = await generateFomoCaptions(
      body.restaurantName ?? 'Our restaurant',
      body.content,
      lang
    )
    return NextResponse.json({ captions })
  } catch (error) {
    console.error('[api/ai/fomo]', error)
    return NextResponse.json({ error: 'Caption generation failed' }, { status: 500 })
  }
}
