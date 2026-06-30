import type { Dish, PostCaptions } from '@/types'

// ── Demo mode ─────────────────────────────────────────────────────────
// Active whenever Supabase is not configured. Lets the whole app be
// clicked through locally with NO backend and NO API keys.
export const DEMO_SESSION_COOKIE = 'md_demo'
export const DEMO_PROFILE_COOKIE = 'md_profile'
export const DEMO_LOGIN_PHONE_COOKIE = 'md_login_phone'

export const DEMO_DISHES: Dish[] = [
  { name: 'Fish curry', price: '120', corrected: false, original: 'Fish curry', veg: 'nonveg' },
  { name: 'Parotta', price: '30', corrected: false, original: 'Parotta', veg: 'veg' },
  { name: 'Chicken biryani', price: '180', corrected: false, original: 'Chicken biryani', veg: 'nonveg' },
  { name: 'Fish fry', price: '90', corrected: false, original: 'Fish fry', veg: 'nonveg' },
]

export const DEMO_CAPTIONS: PostCaptions = {
  lang: 'ml',
  instagram: {
    en: "🔥 Today's specials are here! Fish curry, chicken biryani & hot parotta — fresh off the kitchen. Come hungry! 🍛 #TodaysSpecial #Foodie #Kerala",
    local: "🔥 ഇന്നത്തെ സ്പെഷ്യൽ! ഫിഷ് കറി, ചിക്കൻ ബിരിയാണി, ചൂട് പൊറോട്ട — ഇപ്പോൾ തന്നെ വരൂ! 🍛 #TodaysSpecial",
  },
  whatsapp: {
    en: "🍛 *Today's Specials*\nFish curry – ₹120\nChicken biryani – ₹180\nParotta – ₹30\nFish fry – ₹90\nOrder now! 📞",
    local: "🍛 *ഇന്നത്തെ സ്പെഷ്യൽ*\nഫിഷ് കറി – ₹120\nചിക്കൻ ബിരിയാണി – ₹180\nപൊറോട്ട – ₹30\nഫിഷ് ഫ്രൈ – ₹90\nഇപ്പോൾ ഓർഡർ ചെയ്യൂ! 📞",
  },
  facebook: {
    en: "Today's specials are ready! 🍛 Fresh fish curry, chicken biryani, hot parotta & crispy fish fry. Dine in or take away. #Kochi #Foodie",
    local: "ഇന്നത്തെ സ്പെഷ്യൽ റെഡി! 🍛 ഫിഷ് കറി, ചിക്കൻ ബിരിയാണി, ചൂട് പൊറോട്ട, ഫിഷ് ഫ്രൈ. ഡൈൻ ഇൻ / ടേക്ക് എവേ. #Kochi",
  },
}

export const DEMO_FOMO_CAPTIONS: PostCaptions = {
  lang: 'ml',
  instagram: {
    en: '⚡ FLASH SALE! First 10 guests, 2–4 PM today get a FREE dessert with any main. Run! 🍰 #FlashSale #Kochi #Foodie',
    local: '⚡ ഫ്ലാഷ് സെയിൽ! ഇന്ന് 2–4 PM, ആദ്യ 10 പേർക്ക് ഏത് മെയിനിനൊപ്പവും ഫ്രീ ഡെസ്സർട്ട്! വേഗം വരൂ 🍰 #FlashSale',
  },
  whatsapp: {
    en: '⚡ *Flash Sale — today only!*\nFirst 10 guests between 2–4 PM get a FREE dessert with any main course. See you soon! 🏃',
    local: '⚡ *ഫ്ലാഷ് സെയിൽ — ഇന്ന് മാത്രം!*\n2–4 PM ന് ഇടയിൽ ആദ്യ 10 പേർക്ക് ഏത് മെയിനിനൊപ്പവും ഫ്രീ ഡെസ്സർട്ട്! 🏃',
  },
  facebook: {
    en: '⚡ Flash sale today! First 10 guests between 2–4 PM get a free dessert with any main. Don’t miss out! #Kochi',
    local: '⚡ ഇന്ന് ഫ്ലാഷ് സെയിൽ! 2–4 PM ന് ആദ്യ 10 പേർക്ക് ഫ്രീ ഡെസ്സർട്ട്. മിസ്സാക്കരുത്! #Kochi',
  },
}
