import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { uploadLogo } from '@/lib/cloudinary'
import { credsReady } from '@/lib/utils/env'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { image_data?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.image_data) {
    return NextResponse.json({ error: 'image_data required' }, { status: 400 })
  }

  if (!credsReady.cloudinary()) {
    return NextResponse.json(
      { error: 'Cloudinary not configured. Add CLOUDINARY_* keys to .env.local.' },
      { status: 503 }
    )
  }

  try {
    const { url, publicId } = await uploadLogo(body.image_data, session.user.id)
    await supabase
      .from('restaurant_profiles')
      .update({ logo_url: url, logo_public_id: publicId })
      .eq('user_id', session.user.id)
    return NextResponse.json({ logo_url: url, logo_public_id: publicId })
  } catch (error) {
    console.error('[api/profile/upload-logo]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
