import { create } from 'zustand'
import type { RestaurantProfile } from '@/types'

interface ProfileStore {
  profile: RestaurantProfile | null
  isLoading: boolean
  error: string | null
  fetch: () => Promise<void>
  update: (data: Partial<RestaurantProfile>) => Promise<void>
  setLogo: (url: string) => void
  clear: () => void
}

export const useProfile = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      set({ profile: data, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  update: async (data) => {
    const current = get().profile
    if (current) set({ profile: { ...current, ...data } as RestaurantProfile })
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(current ?? {}), ...data }),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      const updated = await res.json()
      set({ profile: updated })
    } catch (e) {
      set({ profile: current, error: (e as Error).message })
    }
  },

  setLogo: (url) =>
    set((s) => (s.profile ? { profile: { ...s.profile, logo_url: url } } : s)),

  clear: () => set({ profile: null, isLoading: false, error: null }),
}))
