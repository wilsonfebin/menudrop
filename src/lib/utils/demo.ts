import type { Dish, PostCaptions } from '@/types'

// ── Demo mode ─────────────────────────────────────────────────────────
// Active whenever Supabase is not configured. Lets the whole app be
// clicked through locally with NO backend and NO API keys.
export const DEMO_SESSION_COOKIE = 'md_demo'
export const DEMO_PROFILE_COOKIE = 'md_profile'

export const DEMO_DISHES: Dish[] = [
  { name: 'Fish curry', price: '120', corrected: false, original: 'Fish curry', veg: 'nonveg' },
  { name: 'Parotta', price: '30', corrected: false, original: 'Parotta', veg: 'veg' },
  { name: 'Chicken biryani', price: '180', corrected: false, original: 'Chicken biryani', veg: 'nonveg' },
  { name: 'Fish fry', price: '90', corrected: false, original: 'Fish fry', veg: 'nonveg' },
]

export const DEMO_CAPTIONS: PostCaptions = {
  instagram: {
    en: "🔥 Today's specials are here! Fish curry, chicken biryani & hot parotta — fresh off the kitchen. Come hungry! 🍛 #TodaysSpecial #Foodie #Kerala",
    ml: "🔥 ഇന്നത്തെ സ്പെഷ്യൽ! ഫിഷ് കറി, ചിക്കൻ ബിരിയാണി, ചൂട് പൊറോട്ട — ഇപ്പോൾ തന്നെ വരൂ! 🍛 #TodaysSpecial",
  },
  whatsapp: {
    en: "🍛 *Today's Specials*\nFish curry – ₹120\nChicken biryani – ₹180\nParotta – ₹30\nFish fry – ₹90\nOrder now! 📞",
    ml: "🍛 *ഇന്നത്തെ സ്പെഷ്യൽ*\nഫിഷ് കറി – ₹120\nചിക്കൻ ബിരിയാണി – ₹180\nപൊറോട്ട – ₹30\nഫിഷ് ഫ്രൈ – ₹90\nഇപ്പോൾ ഓർഡർ ചെയ്യൂ! 📞",
  },
  facebook: {
    en: "Today's specials are ready! 🍛 Fresh fish curry, chicken biryani, hot parotta & crispy fish fry. Dine in or take away. #Kochi #Foodie",
    ml: "ഇന്നത്തെ സ്പെഷ്യൽ റെഡി! 🍛 ഫിഷ് കറി, ചിക്കൻ ബിരിയാണി, ചൂട് പൊറോട്ട, ഫിഷ് ഫ്രൈ. ഡൈൻ ഇൻ / ടേക്ക് എവേ. #Kochi",
  },
}
