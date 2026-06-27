import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isShort = (txt: string) => /^https?:\/\/\S+$/i.test(txt) && txt.length < 40

// Try several free shorteners in turn so a single outage doesn't fall back to
// the long (coordinate-revealing) URL.
async function tryShorten(url: string): Promise<string | null> {
  const enc = encodeURIComponent(url)
  // TinyURL first (redirects straight to the destination); is.gd as backup.
  // v.gd is intentionally excluded — it shows an interstitial warning page.
  const providers = [
    `https://tinyurl.com/api-create.php?url=${enc}`,
    `https://is.gd/create.php?format=simple&url=${enc}`,
  ]
  for (const p of providers) {
    try {
      const res = await fetch(p, { cache: 'no-store' })
      if (!res.ok) continue
      const txt = (await res.text()).trim()
      if (isShort(txt)) return txt
    } catch {
      /* next provider */
    }
  }
  return null
}

// Returns a tiny URL for the given (maps) link. Falls back to the original on
// total failure or if it's already short.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')?.trim()
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ short: url ?? null })
  }

  try {
    const host = new URL(url).hostname
    if (/(goo\.gl|maps\.app\.goo\.gl|is\.gd|v\.gd|tinyurl\.com|bit\.ly)/i.test(host)) {
      return NextResponse.json({ short: url })
    }
  } catch {
    /* fall through */
  }

  const short = await tryShorten(url)
  return NextResponse.json({ short: short ?? url })
}
