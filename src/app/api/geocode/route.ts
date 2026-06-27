import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function googleKey(): string | null {
  const k = (process.env.GOOGLE_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '').trim()
  if (!k || k.includes('your-') || k.toLowerCase().includes('placeholder') || k.length < 12) return null
  return k
}

// ── Google reverse geocode (most accurate; 10k free/month) ──────────────
interface GComp {
  long_name: string
  types: string[]
}
function gComp(comps: GComp[], type: string): string | undefined {
  return comps.find((c) => c.types.includes(type))?.long_name
}
async function geocodeGoogle(lat: string, lng: string, key: string): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const j = (await res.json()) as {
    status: string
    results?: { address_components: GComp[]; formatted_address: string }[]
  }
  if (j.status !== 'OK' || !j.results?.length) return null
  const c = j.results[0].address_components
  const parts = [
    gComp(c, 'point_of_interest') || gComp(c, 'premise') || gComp(c, 'route'),
    gComp(c, 'sublocality') || gComp(c, 'neighborhood'),
    gComp(c, 'locality') || gComp(c, 'administrative_area_level_2'),
  ]
  const out = dedupe(parts)
  return out.length ? out.join(', ') : j.results[0].formatted_address.split(',').slice(0, 3).join(',').trim()
}

// ── Nominatim reverse geocode (free fallback, no key) ───────────────────
interface NomResult {
  name?: string
  display_name?: string
  address?: Record<string, string>
}
async function geocodeNominatim(lat: string, lng: string): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MenuDrop/1.0 (menudrop.quasarlabs.in)', 'Accept-Language': 'en' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const j = (await res.json()) as NomResult
  const a = j.address ?? {}
  const parts = [
    a.road || a.pedestrian || a.neighbourhood || j.name,
    a.suburb || a.quarter || a.village,
    a.city || a.town || a.municipality,
  ]
  const out = dedupe(parts)
  if (out.length) return out.join(', ')
  return j.display_name ? j.display_name.split(',').slice(0, 3).join(',').trim() : null
}

function dedupe(parts: (string | undefined)[]): string[] {
  const seen = new Set<string>()
  return parts.filter((p): p is string => {
    if (!p || seen.has(p)) return false
    seen.add(p)
    return true
  })
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ name: null })

  const key = googleKey()
  try {
    const name = key
      ? (await geocodeGoogle(lat, lng, key)) ?? (await geocodeNominatim(lat, lng))
      : await geocodeNominatim(lat, lng)
    return NextResponse.json({ name, provider: key ? 'google' : 'nominatim' })
  } catch {
    return NextResponse.json({ name: null })
  }
}
