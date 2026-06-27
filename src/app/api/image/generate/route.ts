import { NextRequest, NextResponse } from 'next/server'
import { composeSpecialsImage, composeFomoImage } from '@/lib/image/composite'
import type {
  BackgroundOption,
  Dish,
  FomoContent,
  GenerateImageRequest,
  ImageFormat,
  RestaurantProfile,
} from '@/types'

export const maxDuration = 30

type Body = GenerateImageRequest & {
  type?: 'special' | 'fomo'
  format?: ImageFormat
  fomo?: FomoContent
}

// Stateless image generation. Returns a PNG directly in the response body.
// Intentionally performs NO storage calls (no Cloudinary/S3/writeFile).
export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const format = (body.format ?? 'portrait') as ImageFormat
  const background = body.background as BackgroundOption
  const profile: Pick<
    RestaurantProfile,
    'name' | 'logo_url' | 'street' | 'city' | 'display_phone' | 'brand_color' | 'location_name' | 'business_hours'
  > = {
    name: body.profile?.name ?? 'Our restaurant',
    logo_url: body.profile?.logo_url ?? null,
    street: body.profile?.street ?? null,
    city: body.profile?.city ?? null,
    display_phone: body.profile?.display_phone ?? null,
    brand_color: body.profile?.brand_color ?? null,
    location_name: body.profile?.location_name ?? null,
    business_hours: body.profile?.business_hours ?? null,
  }

  try {
    let png: Buffer
    let source: string

    if (body.type === 'fomo') {
      if (!body.fomo) {
        return NextResponse.json({ error: 'No update content provided' }, { status: 400 })
      }
      ;({ png, source } = await composeFomoImage(body.fomo, background, profile, format))
    } else {
      const dishes = (body.dishes ?? []) as Dish[]
      if (dishes.length === 0) {
        return NextResponse.json({ error: 'No dishes provided' }, { status: 400 })
      }
      ;({ png, source } = await composeSpecialsImage(dishes, background, profile, format))
    }

    console.log('[image] type:', body.type ?? 'special', 'background:', background?.type, '-> used:', source)

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="menudrop.png"',
        'Cache-Control': 'no-store',
        'X-Background-Source': source,
      },
    })
  } catch (error) {
    console.error('[api/image/generate]', error)
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
