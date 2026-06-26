import { NextRequest, NextResponse } from 'next/server'
import { credsReady } from '@/lib/utils/env'
import { fetchDishPhotoDetailed, activeProvider } from '@/lib/image/stock'

// Visit /api/diag/pexels?q=chicken%20biryani to see exactly why a photo
// did or didn't embed. Returns no secret values — only key length.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? 'chicken biryani'
  const result = await fetchDishPhotoDetailed(q)
  return NextResponse.json({
    provider: activeProvider(),
    unsplashConfigured: credsReady.unsplash(),
    pexelsConfigured: credsReady.pexels(),
    query: q,
    embedded: !!result.buffer,
    usedProvider: result.provider,
    httpStatus: result.status,
    results: result.results,
    error: result.error ?? null,
  })
}
