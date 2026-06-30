import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  BackgroundOption,
  Dish,
  FomoContent,
  ImageFormat,
  LangCode,
  PostCaptions,
  SpecialsTemplate,
} from '@/types'

interface CreateStore {
  // which kind of post is being made
  mode: 'special' | 'fomo'
  // input
  inputType: 'photo' | 'text'
  rawText: string
  photoData: string | null
  // pipeline output
  dishes: Dish[]
  fomo: FomoContent | null
  captions: PostCaptions | null
  background: BackgroundOption
  format: ImageFormat
  secondLang: LangCode
  template: SpecialsTemplate
  // setters
  setMode: (m: 'special' | 'fomo') => void
  setInputType: (t: 'photo' | 'text') => void
  setRawText: (s: string) => void
  setPhoto: (d: string | null) => void
  setDishes: (d: Dish[]) => void
  updateDish: (index: number, patch: Partial<Dish>) => void
  removeDish: (index: number) => void
  addDish: () => void
  setFomo: (f: FomoContent | null) => void
  updateFomo: (patch: Partial<FomoContent>) => void
  setCaptions: (c: PostCaptions) => void
  setBackground: (b: BackgroundOption) => void
  setFormat: (f: ImageFormat) => void
  setSecondLang: (l: LangCode) => void
  setTemplate: (t: SpecialsTemplate) => void
  reset: () => void
}

const initialBackground: BackgroundOption = { type: 'plain' }

export const useCreate = create<CreateStore>()(
  persist(
    (set, get) => ({
  mode: 'special',
  inputType: 'photo',
  rawText: '',
  photoData: null,
  dishes: [],
  fomo: null,
  captions: null,
  background: initialBackground,
  format: 'story',
  secondLang: 'ml',
  template: 'midnight',

  setMode: (mode) => set({ mode }),
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
  setFomo: (fomo) => set({ fomo }),
  updateFomo: (patch) => {
    const cur = get().fomo
    if (cur) set({ fomo: { ...cur, ...patch } })
  },
  setCaptions: (captions) => set({ captions }),
  setBackground: (background) => set({ background }),
  setFormat: (format) => set({ format }),
  setSecondLang: (secondLang) => set({ secondLang }),
  setTemplate: (template) => set({ template }),
  reset: () =>
    set({
      mode: 'special',
      inputType: 'photo',
      rawText: '',
      photoData: null,
      dishes: [],
      fomo: null,
      captions: null,
      background: initialBackground,
      format: 'story',
      // secondLang and template are intentionally preserved across resets
      // (they're preferences, not per-post content).
    }),
    }),
    {
      name: 'menudrop-create',
      // Bumped so older persisted sessions (which pinned a square/portrait
      // size) are migrated — every post is 9:16 now.
      version: 1,
      migrate: (persisted) => {
        if (persisted && typeof persisted === 'object') {
          delete (persisted as Record<string, unknown>).format
        }
        return persisted as CreateStore
      },
      // Guard sessionStorage writes — never let a quota error reach the user.
      storage: createJSONStorage(() => ({
        getItem: (k) => sessionStorage.getItem(k),
        setItem: (k, v) => {
          try {
            sessionStorage.setItem(k, v)
          } catch {
            /* over quota — skip persistence for this write */
          }
        },
        removeItem: (k) => sessionStorage.removeItem(k),
      })),
      // Large base64 blobs (photoData, and a photo background's image_data) are
      // intentionally excluded — sessionStorage has a ~5MB quota and would throw
      // QuotaExceededError. Photo backgrounds stay in memory for the session.
      partialize: (state) => ({
        mode: state.mode,
        inputType: state.inputType,
        rawText: state.rawText,
        dishes: state.dishes,
        fomo: state.fomo,
        captions: state.captions,
        background:
          state.background.type === 'photo'
            ? ({ type: 'plain' } as BackgroundOption)
            : state.background,
        // format is intentionally NOT persisted — all posts are 9:16, so it
        // always resolves to the 'story' default.
        secondLang: state.secondLang,
        template: state.template,
      }),
    }
  )
)
