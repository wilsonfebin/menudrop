export interface RestaurantProfile {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  logo_public_id: string | null
  street: string | null
  city: string | null
  display_phone: string | null
  maps_link: string | null
  location_name: string | null
  business_hours: string | null
  caption_language: 'en' | 'ml' | 'both'
  second_language: LangCode | null
  brand_color: string | null
  created_at: string
  updated_at: string
}

// English is always generated; the second language is selectable.
export type LangCode = 'en' | 'ml' | 'ta' | 'hi' | 'kn' | 'te' | 'bn'

export const LANGUAGES: Record<LangCode, string> = {
  en: 'English',
  ml: 'Malayalam',
  ta: 'Tamil',
  hi: 'Hindi',
  kn: 'Kannada',
  te: 'Telugu',
  bn: 'Bengali',
}

export const SECOND_LANGUAGES: LangCode[] = ['ml', 'ta', 'hi', 'kn', 'te', 'bn']

export interface Dish {
  name: string
  price: string | null
  corrected: boolean
  original: string | null
  veg?: 'veg' | 'nonveg' | 'vegan' | null
}

// `en` is always English; `local` is the chosen second language (code in `lang`).
export interface PostCaptions {
  lang: LangCode
  instagram: { en: string; local: string }
  whatsapp: { en: string; local: string }
  facebook: { en: string; local: string }
}

// ── FOMO updates (urgent, time-sensitive posts) ───────────────────────
export type FomoTemplate = 'happy_hour' | 'flash_sale' | 'limited' | 'holiday' | 'custom'

export interface FomoContent {
  template: FomoTemplate
  badge: string // urgency pill, e.g. "FLASH SALE"
  headline: string // big main line
  detail: string // offer / condition sub-line
  timing: string // time window or date
  item: string // hero item (limited stock)
  qty: number | null // remaining count (limited stock)
}

export const FOMO_BADGES: Record<FomoTemplate, string> = {
  happy_hour: 'HAPPY HOUR',
  flash_sale: 'FLASH SALE',
  limited: 'LIMITED',
  holiday: 'OPEN TODAY',
  custom: 'TODAY ONLY',
}

export const FOMO_LABELS: Record<FomoTemplate, string> = {
  happy_hour: 'Happy Hour',
  flash_sale: 'Flash Sale',
  limited: 'Limited stock',
  holiday: 'Holiday hours',
  custom: 'Custom',
}

export interface PostHistory {
  id: string
  user_id: string
  kind: 'special' | 'fomo'
  dishes: Dish[]
  fomo: FomoContent | null
  captions: PostCaptions
  background: BackgroundOption | null
  format: ImageFormat | null
  template: SpecialsTemplate | null
  image_url: string | null
  platform_used: string[]
  created_at: string
}

export type BackgroundOption =
  | { type: 'photo'; image_data: string }
  | { type: 'dish_photo' }
  | { type: 'plain' }
  | { type: 'brand_color'; color: string }

export interface GenerateImageRequest {
  dishes: Dish[]
  background: BackgroundOption
  profile: Pick<
    RestaurantProfile,
    'name' | 'logo_url' | 'street' | 'city' | 'display_phone' | 'brand_color' | 'location_name' | 'business_hours'
  >
}

export type Plan = 'free' | 'starter' | 'pro'

export interface Subscription {
  id: string
  user_id: string
  plan: Plan
  razorpay_sub_id: string | null
  status: 'active' | 'cancelled' | 'expired'
  current_period_end: string | null
  created_at: string
  updated_at: string
}

// ── Specials poster templates (selectable looks) ──────────────────────
// 'classic' = the original photo-forward overlay. The rest are themed
// layouts: logo badge, "Today's SPECIALS" header, featured-dish ribbon,
// dotted-leader price list, and a hero photo band at the bottom.
export type SpecialsTemplate = 'classic' | 'midnight' | 'botanic' | 'maroon' | 'chalk'

export const SPECIALS_TEMPLATES: {
  id: SpecialsTemplate
  label: string
  swatch: [string, string]
}[] = [
  { id: 'midnight', label: 'Midnight', swatch: ['#14130F', '#F0871E'] },
  { id: 'botanic', label: 'Botanic', swatch: ['#F4F0E5', '#1F5A3A'] },
  { id: 'maroon', label: 'Royal', swatch: ['#3A0E10', '#E3B860'] },
  { id: 'chalk', label: 'Chalkboard', swatch: ['#1B1B19', '#E08A3C'] },
  { id: 'classic', label: 'Classic', swatch: ['#0C447C', '#FFC65C'] },
]

export type ImageFormat = 'square' | 'portrait' | 'story'

export const IMAGE_FORMATS: Record<
  ImageFormat,
  { w: number; h: number; label: string; ratio: string; hint: string }
> = {
  square: { w: 1080, h: 1080, label: 'Square', ratio: '1:1', hint: 'Feed' },
  portrait: { w: 1080, h: 1350, label: 'Portrait', ratio: '4:5', hint: 'Insta / FB feed' },
  story: { w: 1080, h: 1920, label: 'Story', ratio: '9:16', hint: 'Stories / Status' },
}
