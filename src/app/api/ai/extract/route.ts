import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { extractFromText, extractFromImage } from '@/lib/ai/extract'
import { credsReady, isDemoMode } from '@/lib/utils/env'
import { DEMO_DISHES } from '@/lib/utils/demo'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Demo mode (no OpenAI key): return sample dishes so the flow works.
  if (isDemoMode() || !credsReady.openai()) {
    return NextResponse.json({ dishes: DEMO_DISHES, demo: true })
  }

  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session && credsReady.supabase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string; image_data?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const dishes = body.image_data
      ? await extractFromImage(body.image_data)
      : body.text
      ? await extractFromText(body.text)
      : null
    if (!dishes) {
      return NextResponse.json({ error: 'Provide text or image_data' }, { status: 400 })
    }
    return NextResponse.json({ dishes })
  } catch (error) {
    console.error('[api/ai/extract]', error)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
