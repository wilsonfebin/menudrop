import type {
  BackgroundOption,
  Dish,
  FomoContent,
  ImageFormat,
  RestaurantProfile,
  SpecialsTemplate,
} from '@/types'

type ProfilePayload = Pick<
  RestaurantProfile,
  'name' | 'logo_url' | 'street' | 'city' | 'display_phone' | 'brand_color' | 'location_name' | 'business_hours'
>

// POST to the image API and return the rendered PNG as a Blob.
export async function requestSpecialsBlob(
  dishes: Dish[],
  background: BackgroundOption,
  profile: ProfilePayload,
  format: ImageFormat = 'portrait',
  template: SpecialsTemplate = 'classic'
): Promise<Blob> {
  const res = await fetch('/api/image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'special', dishes, background, profile, format, template }),
  })
  if (!res.ok) throw new Error('Image generation failed')
  return res.blob()
}

// POST a FOMO update and return the rendered PNG as a Blob.
export async function requestFomoBlob(
  fomo: FomoContent,
  background: BackgroundOption,
  profile: ProfilePayload,
  format: ImageFormat = 'portrait'
): Promise<Blob> {
  const res = await fetch('/api/image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'fomo', fomo, background, profile, format }),
  })
  if (!res.ok) throw new Error('Image generation failed')
  return res.blob()
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadSpecialsImage(
  dishes: Dish[],
  background: BackgroundOption,
  profile: ProfilePayload,
  format: ImageFormat = 'portrait'
): Promise<void> {
  const blob = await requestSpecialsBlob(dishes, background, profile, format)
  triggerDownload(blob, `${(profile.name || 'menudrop').replace(/\s+/g, '-')}-specials.png`)
}
