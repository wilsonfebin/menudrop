import { NextRequest, NextResponse } from 'next/server'
import { composeSpecialsImage } from '@/lib/image/composite'
import type { GenerateImageRequest, ImageFormat } from '@/types'

export const maxDuration = 30

// Stateless image generation. Returns a PNG directly in the response body.
// Intentionally performs NO storage calls (no Cloudinary/S3/writeFile).
export async function POST(req: NextRequest) {
  let body: GenerateImageRequest
  try {
    body = (await req.json()) as GenerateImageRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.dishes || body.dishes.length === 0) {
    return NextResponse.json({ error: 'No dishes provided' }, { status: 400 })
  }

  try {
    const format = ((body as { format?: ImageFormat }).format ?? 'portrait') as ImageFormat
    const { png, source } = await composeSpecialsImage(
      body.dishes,
      body.background,
      {
        name: body.profile?.name ?? 'Our restaurant',
        logo_url: body.profile?.logo_url ?? null,
        street: body.profile?.street ?? null,
        city: body.profile?.city ?? null,
        display_phone: body.profile?.display_phone ?? null,
        brand_color: body.profile?.brand_color ?? null,
      },
      format
    )

    console.log('[image] requested background:', body.background?.type, '-> used:', source)

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="specials.png"',
        'Cache-Control': 'no-store',
        'X-Background-Source': source,
      },
    })
  } catch (error) {
    console.error('[api/image/generate]', error)
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
