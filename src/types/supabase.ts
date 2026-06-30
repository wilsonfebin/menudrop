// Minimal generated-style typing for the Supabase client.
// Regenerate with: supabase gen types typescript --project-id <id> > src/types/supabase.ts
import type { Dish, LangCode, PostCaptions } from '@/types'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      restaurant_profiles: {
        Row: {
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
        Insert: Partial<Database['public']['Tables']['restaurant_profiles']['Row']> & {
          user_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['restaurant_profiles']['Row']>
      }
      post_history: {
        Row: {
          id: string
          user_id: string
          kind: string
          dishes: Dish[]
          fomo: Json | null
          captions: PostCaptions | Record<string, never>
          background: Json | null
          format: string | null
          template: string | null
          image_url: string | null
          platform_used: string[]
          created_at: string
        }
        Insert: {
          user_id: string
          kind?: string
          dishes: Dish[]
          fomo?: Json | null
          captions: PostCaptions
          background?: Json | null
          format?: string | null
          template?: string | null
          image_url?: string | null
          platform_used?: string[]
        }
        Update: Partial<Database['public']['Tables']['post_history']['Row']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'starter' | 'pro'
          razorpay_sub_id: string | null
          status: 'active' | 'cancelled' | 'expired'
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: { user_id: string; plan?: 'free' | 'starter' | 'pro' }
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
