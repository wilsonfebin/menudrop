// Central place to detect whether a given integration has real credentials.
// Lets the app boot and render with placeholder values while clearly
// signalling — at the API boundary — when a live key is required.
const isPlaceholder = (v: string | undefined) =>
  !v || v.trim() === '' || v.toLowerCase().includes('placeholder') || v.includes('your-')

export const credsReady = {
  supabase: () =>
    !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  openai: () => !isPlaceholder(process.env.OPENAI_API_KEY),
  cloudinary: () =>
    !isPlaceholder(process.env.CLOUDINARY_CLOUD_NAME) &&
    !isPlaceholder(process.env.CLOUDINARY_API_KEY) &&
    !isPlaceholder(process.env.CLOUDINARY_API_SECRET),
  razorpay: () =>
    !isPlaceholder(process.env.RAZORPAY_KEY_ID) &&
    !isPlaceholder(process.env.RAZORPAY_KEY_SECRET),
  msg91: () => !isPlaceholder(process.env.MSG91_AUTH_KEY),
  pexels: () => !isPlaceholder(process.env.PEXELS_API_KEY),
  unsplash: () => !isPlaceholder(process.env.UNSPLASH_ACCESS_KEY),
}

// Explicit override: set DEMO_MODE=true in .env.local to force a fully
// keyless demo (sample data, cookie session) even if real keys are present.
// Also auto-enabled whenever Supabase is not configured.
export const isDemoMode = () =>
  process.env.DEMO_MODE === 'true' || !credsReady.supabase()
