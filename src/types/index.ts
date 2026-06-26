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
  caption_language: 'en' | 'ml' | 'both'
  brand_color: string | null
  created_at: string
  updated_at: string
}

export interface Dish {
  name: string
  price: string | null
  corrected: boolean
  original: string | null
  veg?: 'veg' | 'nonveg' | null
}

export interface PostCaptions {
  instagram: { en: string; ml: string }
  whatsapp: { en: string; ml: string }
  facebook: { en: string; ml: string }
}

export interface PostHistory {
  id: string
  user_id: string
  dishes: Dish[]
  captions: PostCaptions
  background: BackgroundOption | null
  format: ImageFormat | null
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
    'name' | 'logo_url' | 'street' | 'city' | 'display_phone' | 'brand_color'
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

export type ImageFormat = 'square' | 'portrait' | 'story'

export const IMAGE_FORMATS: Record<
  ImageFormat,
  { w: number; h: number; label: string; ratio: string; hint: string }
> = {
  square: { w: 1080, h: 1080, label: 'Square', ratio: '1:1', hint: 'Feed' },
  portrait: { w: 1080, h: 1350, label: 'Portrait', ratio: '4:5', hint: 'Insta / FB feed' },
  story: { w: 1080, h: 1920, label: 'Story', ratio: '9:16', hint: 'Stories / Status' },
}
