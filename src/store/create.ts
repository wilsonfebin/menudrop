import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { BackgroundOption, Dish, ImageFormat, PostCaptions } from '@/types'

interface CreateStore {
  // input
  inputType: 'photo' | 'text'
  rawText: string
  photoData: string | null
  // pipeline output
  dishes: Dish[]
  captions: PostCaptions | null
  background: BackgroundOption
  format: ImageFormat
  // setters
  setInputType: (t: 'photo' | 'text') => void
  setRawText: (s: string) => void
  setPhoto: (d: string | null) => void
  setDishes: (d: Dish[]) => void
  updateDish: (index: number, patch: Partial<Dish>) => void
  removeDish: (index: number) => void
  addDish: () => void
  setCaptions: (c: PostCaptions) => void
  setBackground: (b: BackgroundOption) => void
  setFormat: (f: ImageFormat) => void
  reset: () => void
}

const initialBackground: BackgroundOption = { type: 'plain' }

export const useCreate = create<CreateStore>()(
  persist(
    (set, get) => ({
  inputType: 'photo',
  rawText: '',
  photoData: null,
  dishes: [],
  captions: null,
  background: initialBackground,
  format: 'portrait',

  setInputType: (inputType) => set({ inputType }),
  setRawText: (rawText) => set({ rawText }),
  setPhoto: (photoData) => set({ photoData }),
  setDishes: (dishes) => set({ dishes }),
  updateDish: (index, patch) =>
    set({
      dishes: get().dishes.map((d, i) =>
        i === index ? { ...d, ...patch, corrected: true } : d
      ),
    }),
  removeDish: (index) =>
    set({ dishes: get().dishes.filter((_, i) => i !== index) }),
  addDish: () =>
    set({
      dishes: [
        ...get().dishes,
        { name: '', price: null, corrected: true, original: null, veg: null },
      ],
    }),
  setCaptions: (captions) => set({ captions }),
  setBackground: (background) => set({ background }),
  setFormat: (format) => set({ format }),
  reset: () =>
    set({
      inputType: 'photo',
      rawText: '',
      photoData: null,
      dishes: [],
      captions: null,
      background: initialBackground,
      format: 'portrait',
    }),
    }),
    {
      name: 'menudrop-create',
      storage: createJSONStorage(() => sessionStorage),
      // photoData (a large base64 string) is intentionally excluded.
      partialize: (state) => ({
        inputType: state.inputType,
        rawText: state.rawText,
        dishes: state.dishes,
        captions: state.captions,
        background: state.background,
        format: state.format,
      }),
    }
  )
)
