import { credsReady } from '@/lib/utils/env'

export type StockProvider = 'unsplash' | 'pexels'

export interface StockResult {
  buffer: Buffer | null
  provider: StockProvider | null
  status: number
  results: number
  query: string
  error?: string
}

interface SearchHit {
  status: number
  url: string | null
  results: number
  error?: string
}

function clean(v: string | undefined): string {
  return (v ?? '').trim().replace(/^["']|["']$/g, '')
}

// Which provider to use: STOCK_PROVIDER=unsplash|pexels, or auto (prefer
// Unsplash for quality, fall back to Pexels).
export function activeProvider(): StockProvider | null {
  const pref = (process.env.STOCK_PROVIDER ?? 'auto').toLowerCase()
  if (pref === 'unsplash') return credsReady.unsplash() ? 'unsplash' : null
  if (pref === 'pexels') return credsReady.pexels() ? 'pexels' : null
  if (credsReady.unsplash()) return 'unsplash'
  if (credsReady.pexels()) return 'pexels'
  return null
}

// Unsplash — higher quality / better curated. HD square via Imgix params.
async function searchUnsplash(query: string): Promise<SearchHit> {
  const key = clean(process.env.UNSPLASH_ACCESS_KEY)
  const q = encodeURIComponent(query)
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${q}&per_page=20&orientation=squarish&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}` }, cache: 'no-store' }
    )
    if (!res.ok) return { status: res.status, url: null, results: 0, error: (await res.text().catch(() => '')).slice(0, 200) }
    const json = (await res.json()) as {
      total?: number
      results?: { urls?: { raw?: string; full?: string; regular?: string } }[]
    }
    const arr = json.results ?? []
    const pick = arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined
    const raw = pick?.urls?.raw
    const url = raw ? `${raw}&w=1080&h=1080&fit=crop&crop=entropy&q=85` : pick?.urls?.regular ?? null
    return { status: res.status, url, results: json.total ?? arr.length }
  } catch (e) {
    return { status: 0, url: null, results: 0, error: (e as Error).message }
  }
}

// Pexels — fetch several and pick at random for variety.
async function searchPexels(query: string): Promise<SearchHit> {
  const key = clean(process.env.PEXELS_API_KEY)
  const q = encodeURIComponent(query)
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${q}&per_page=15&orientation=square`,
      { headers: { Authorization: key }, cache: 'no-store' }
    )
    if (!res.ok) return { status: res.status, url: null, results: 0, error: (await res.text().catch(() => '')).slice(0, 200) }
    const json = (await res.json()) as {
      total_results?: number
      photos?: { src?: { original?: string; large2x?: string; large?: string } }[]
    }
    const photos = json.photos ?? []
    const pick = photos.length ? photos[Math.floor(Math.random() * photos.length)] : undefined
    const url = pick?.src?.large2x ?? pick?.src?.original ?? pick?.src?.large ?? null
    return { status: res.status, url, results: json.total_results ?? photos.length }
  } catch (e) {
    return { status: 0, url: null, results: 0, error: (e as Error).message }
  }
}

function runSearch(provider: StockProvider, query: string): Promise<SearchHit> {
  return provider === 'unsplash' ? searchUnsplash(query) : searchPexels(query)
}

export async function fetchDishPhotoDetailed(query: string): Promise<StockResult> {
  const provider = activeProvider()
  if (!provider) {
    return { buffer: null, provider: null, status: -1, results: 0, query, error: 'No stock photo key configured' }
  }
  const candidates = [`${query} food dish`, query, 'indian food platter']
  let last: { status: number; results: number; error?: string; query: string } = { status: 0, results: 0, query }
  for (const q of candidates) {
    const r = await runSearch(provider, q)
    last = { status: r.status, results: r.results, error: r.error, query: q }
    if (r.url) {
      try {
        const img = await fetch(r.url, { cache: 'no-store' })
        if (img.ok) {
          return { buffer: Buffer.from(await img.arrayBuffer()), provider, status: r.status, results: r.results, query: q }
        }
        last.error = `image download failed: ${img.status}`
      } catch (e) {
        last.error = (e as Error).message
      }
    }
  }
  return { buffer: null, provider, status: last.status, results: last.results, query: last.query, error: last.error }
}

export async function fetchDishPhoto(query: string): Promise<Buffer | null> {
  const r = await fetchDishPhotoDetailed(query)
  if (!r.buffer) {
    console.warn('[stock] no photo embedded:', { provider: r.provider, query: r.query, httpStatus: r.status, results: r.results, error: r.error })
  }
  return r.buffer
}
