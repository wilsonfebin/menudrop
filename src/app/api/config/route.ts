import { NextResponse } from 'next/server'
import { credsReady, isDemoMode } from '@/lib/utils/env'

// Exposes capability flags (booleans only) so the UI can show whether
// optional integrations are configured. No secret values are returned.
export async function GET() {
  const pexels = credsReady.pexels()
  const unsplash = credsReady.unsplash()
  return NextResponse.json({
    demo: isDemoMode(),
    photo: pexels || unsplash,
    pexels,
    unsplash,
    cloudinary: credsReady.cloudinary(),
    openai: credsReady.openai(),
  })
}
