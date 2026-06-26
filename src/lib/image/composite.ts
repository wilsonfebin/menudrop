import sharp from 'sharp'
import { buildTextLayer } from '@/lib/image/text-layer'
import { fetchDishPhoto } from '@/lib/image/stock'
import { IMAGE_FORMATS } from '@/types'
import type { BackgroundOption, Dish, ImageFormat, RestaurantProfile } from '@/types'

interface RGB {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): RGB {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return { r: 24, g: 95, b: 165 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}
function toHex({ r, g, b }: RGB): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}
const darken = (c: RGB, f: number): RGB => ({ r: c.r * f, g: c.g * f, b: c.b * f })
const lighten = (c: RGB, f: number): RGB => ({
  r: c.r + (255 - c.r) * f,
  g: c.g + (255 - c.g) * f,
  b: c.b + (255 - c.b) * f,
})

function dataUriToBuffer(dataUri: string): Buffer {
  const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri
  return Buffer.from(base64, 'base64')
}

function gradientPng(base: RGB, w: number, h: number): Promise<Buffer> {
  const c1 = toHex(lighten(base, 0.22))
  const c2 = toHex(darken(base, 0.5))
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${c1}"/>
          <stop offset="1" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>
      <circle cx="${w * 0.86}" cy="${h * 0.12}" r="220" fill="#ffffff" fill-opacity="0.06"/>
      <circle cx="${w * 0.08}" cy="${h * 0.94}" r="260" fill="#ffffff" fill-opacity="0.05"/>
    </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

function processPhoto(buf: Buffer, w: number, h: number): Promise<Buffer> {
  return sharp(buf)
    .resize(w, h, { fit: 'cover', position: sharp.strategy.attention })
    .blur(2)
    .modulate({ brightness: 0.92, saturation: 1.16 })
    .png()
    .toBuffer()
}

async function buildBackground(
  background: BackgroundOption,
  dishes: Dish[],
  w: number,
  h: number
): Promise<{ buffer: Buffer; source: string }> {
  if (background.type === 'photo') {
    const buf = dataUriToBuffer(background.image_data)
    if (!buf || buf.length < 100) throw new Error('Empty image buffer')
    return { buffer: await processPhoto(buf, w, h), source: 'user-photo' }
  }
  if (background.type === 'dish_photo') {
    const query = dishes.find((d) => d.name)?.name ?? 'restaurant food'
    const photo = await fetchDishPhoto(query)
    if (photo) return { buffer: await processPhoto(photo, w, h), source: 'dish-photo' }
    return { buffer: await gradientPng({ r: 24, g: 95, b: 165 }, w, h), source: 'dish-photo-fallback-gradient' }
  }
  const base = background.type === 'brand_color' ? hexToRgb(background.color) : { r: 24, g: 95, b: 165 }
  return { buffer: await gradientPng(base, w, h), source: `${background.type}-gradient` }
}

async function buildLogoBadge(
  url: string | null,
  w: number
): Promise<{ input: Buffer; top: number; left: number } | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const src = Buffer.from(await res.arrayBuffer())
    const size = 150
    const ring = 10
    const full = size + ring * 2
    const ringMask = Buffer.from(`<svg width="${full}" height="${full}" xmlns="http://www.w3.org/2000/svg"><circle cx="${full / 2}" cy="${full / 2}" r="${full / 2}" fill="#fff"/></svg>`)
    const innerMask = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`)
    const backing = await sharp({ create: { width: full, height: full, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.95 } } })
      .composite([{ input: ringMask, blend: 'dest-in' }]).png().toBuffer()
    const logoCircle = await sharp(src).resize(size, size, { fit: 'cover', position: 'centre' })
      .composite([{ input: innerMask, blend: 'dest-in' }]).png().toBuffer()
    const badge = await sharp(backing).composite([{ input: logoCircle, top: ring, left: ring }]).png().toBuffer()
    return { input: badge, top: 54, left: w - full - 54 }
  } catch {
    return null
  }
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return (words[0]?.slice(0, 2) || '·').toUpperCase()
}

/**
 * Stateless: dishes + background + profile + format -> attractive PNG Buffer
 * at the requested aspect ratio (square / portrait / story).
 */
export async function composeSpecialsImage(
  dishes: Dish[],
  background: BackgroundOption,
  profile: Pick<
    RestaurantProfile,
    'name' | 'logo_url' | 'street' | 'city' | 'display_phone' | 'brand_color'
  >,
  format: ImageFormat = 'portrait'
): Promise<{ png: Buffer; source: string }> {
  const { w, h } = IMAGE_FORMATS[format] ?? IMAGE_FORMATS.portrait
  const { buffer: base, source } = await buildBackground(background, dishes, w, h)
  const logo = await buildLogoBadge(profile.logo_url ?? null, w)
  const monogram = logo ? null : initials(profile.name)
  const overlay = buildTextLayer({
    dishes,
    profile,
    width: w,
    height: h,
    reserveLogo: !!logo || !!monogram,
    monogram,
  })

  const layers: sharp.OverlayOptions[] = [{ input: overlay, top: 0, left: 0 }]
  if (logo) layers.push(logo)

  const png = await sharp(base).composite(layers).png({ quality: 92 }).toBuffer()
  return { png, source }
}
