import type { FomoContent, RestaurantProfile } from '@/types'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (((cur ? cur + ' ' : '') + w).length <= maxChars) cur = cur ? `${cur} ${w}` : w
    else {
      if (cur) lines.push(cur)
      cur = w
    }
    if (lines.length >= maxLines) break
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  return lines
}

interface BuildOpts {
  content: FomoContent
  profile: Pick<
    RestaurantProfile,
    'name' | 'street' | 'city' | 'display_phone' | 'location_name' | 'business_hours'
  >
  width?: number
  height?: number
  textColor?: string
  accentColor?: string
  badgeColor?: string
  reserveLogo?: boolean
  monogram?: string | null
}

/** Headline-first FOMO poster overlay (badge + headline + detail + timing). */
export function buildFomoLayer({
  content,
  profile,
  width = 1080,
  height = 1080,
  textColor = '#FFFFFF',
  accentColor = '#FFC65C',
  badgeColor = '#E23B3B',
  reserveLogo = false,
  monogram = null,
}: BuildOpts): Buffer {
  const W = width
  const H = height
  const cx = W / 2
  const padX = 80
  const maxW = W - padX * 2

  const shadow = (
    x: number, y: number, size: number, weight: number, anchor: string,
    extra: string, content2: string, fill: string
  ) => `
      <text x="${x + 3}" y="${y + 3}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="#000000" fill-opacity="0.5" font-family="Helvetica, Arial, sans-serif" ${extra}>${content2}</text>
      <text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}" font-family="Helvetica, Arial, sans-serif" ${extra}>${content2}</text>`

  // ── footer lines (place / hours / phone) ──────────────────────────
  const placeRaw =
    profile.location_name && profile.location_name.trim()
      ? profile.location_name.trim()
      : [profile.street, profile.city].filter(Boolean).join(', ')
  const footerTexts = [escapeXml(placeRaw), escapeXml((profile.business_hours ?? '').trim()), escapeXml(profile.display_phone ?? '')]
  type FL = { text: string; size: number; weight: number; op: number }
  const footerLines: FL[] = []
  if (footerTexts[0]) footerLines.push({ text: footerTexts[0], size: 28, weight: 400, op: 0.82 })
  if (footerTexts[1]) footerLines.push({ text: footerTexts[1], size: 27, weight: 400, op: 0.82 })
  if (footerTexts[2]) footerLines.push({ text: footerTexts[2], size: 32, weight: 600, op: 1 })
  const lineH = 44
  const footerH = footerLines.length ? footerLines.length * lineH + 50 : 60
  const footerStartY = H - 46 - (footerLines.length - 1) * lineH
  const footer = footerLines
    .map((ln, i) => `<text x="${cx}" y="${footerStartY + i * lineH}" text-anchor="middle" font-size="${ln.size}" font-weight="${ln.weight}" fill="${textColor}" fill-opacity="${ln.op}" letter-spacing="${ln.size >= 32 ? 1 : 0.5}" font-family="Helvetica, Arial, sans-serif">${ln.text}</text>`)
    .join('')

  // ── center block: badge, headline, detail, qty, timing ─────────────
  const badge = escapeXml((content.badge || 'TODAY ONLY').toUpperCase())
  const badgeFont = 34
  const badgeH = 60
  const badgeW = Math.min(maxW, badge.length * badgeFont * 0.66 + 64)

  const hl = (content.headline || '').trim()
  const hlFont = hl.length > 38 ? 56 : hl.length > 20 ? 70 : 86
  const hlLines = wrap(hl, Math.max(8, Math.floor(maxW / (hlFont * 0.56))), 3)
  const hlLineH = hlFont * 1.12

  const detail = (content.detail || '').trim()
  const detailFont = 38
  const detailLines = detail ? wrap(detail, Math.floor(maxW / (detailFont * 0.5)), 2) : []
  const detailLineH = detailFont * 1.2

  const qtyText = content.qty != null ? `Only ${content.qty} left` : ''
  const timing = (content.timing || '').trim()

  let blockH = badgeH + 40
  blockH += hlLines.length * hlLineH + 12
  if (qtyText) blockH += 78
  if (detailLines.length) blockH += detailLines.length * detailLineH + 8
  if (timing) blockH += 54

  const regionTop = 300
  const regionBottom = H - footerH
  let y = regionTop + Math.max(0, (regionBottom - regionTop - blockH) / 2) + badgeH

  // badge pill
  const badgePill = `
    <rect x="${cx - badgeW / 2}" y="${y - badgeH + 12}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="${badgeColor}"/>
    <text x="${cx}" y="${y - badgeH / 2 + 22}" text-anchor="middle" font-size="${badgeFont}" font-weight="800" fill="#FFFFFF" letter-spacing="3" font-family="Helvetica, Arial, sans-serif">${badge}</text>`
  y += 40

  // headline
  let headlineSvg = ''
  hlLines.forEach((ln) => {
    y += hlFont
    headlineSvg += shadow(cx, y, hlFont, 800, 'middle', 'letter-spacing="0.5"', escapeXml(ln), textColor)
    y += hlLineH - hlFont
  })
  y += 12

  // qty (limited)
  let qtySvg = ''
  if (qtyText) {
    y += 56
    qtySvg = shadow(cx, y, 64, 800, 'middle', 'letter-spacing="0.5"', escapeXml(qtyText), accentColor)
    y += 22
  }

  // detail
  let detailSvg = ''
  detailLines.forEach((ln) => {
    y += detailFont
    detailSvg += shadow(cx, y, detailFont, 500, 'middle', '', escapeXml(ln), textColor)
    y += detailLineH - detailFont
  })
  if (detailLines.length) y += 8

  // timing
  let timingSvg = ''
  if (timing) {
    y += 40
    timingSvg = shadow(cx, y, 36, 700, 'middle', 'letter-spacing="1"', escapeXml(timing), accentColor)
  }

  // restaurant name (top-left) + logo badge (top-right)
  const nameMax = reserveLogo ? W - 320 : W - 120
  const nameEl = shadow(62, 200, 46, 800, 'start', `clip-path="url(#nameClip)"`, escapeXml(profile.name), textColor)

  const badgeFull = 170
  const bR = badgeFull / 2
  const bCx = W - bR - 54
  const bCy = 54 + bR
  const monoSize = (monogram?.length ?? 0) > 1 ? 56 : 64
  const monogramSvg = monogram
    ? `<circle cx="${bCx}" cy="${bCy}" r="${bR}" fill="#FFFFFF" fill-opacity="0.95"/><circle cx="${bCx}" cy="${bCy}" r="${bR - 10}" fill="${accentColor}"/><text x="${bCx}" y="${bCy + monoSize / 3}" text-anchor="middle" font-size="${monoSize}" font-weight="800" fill="#1A1917" font-family="Helvetica, Arial, sans-serif" letter-spacing="1">${escapeXml(monogram)}</text>`
    : ''

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000000" stop-opacity="0.6"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0.15"/>
        </linearGradient>
        <linearGradient id="botScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000000" stop-opacity="0.15"/>
          <stop offset="1" stop-color="#080A12" stop-opacity="0.85"/>
        </linearGradient>
        <clipPath id="nameClip"><rect x="0" y="150" width="${nameMax}" height="70"/></clipPath>
      </defs>
      <rect x="0" y="0" width="${W}" height="${H}" fill="#000000" fill-opacity="0.28"/>
      <rect x="0" y="0" width="${W}" height="320" fill="url(#topScrim)"/>
      <rect x="0" y="${H - 320}" width="${W}" height="320" fill="url(#botScrim)"/>
      ${nameEl}
      ${monogramSvg}
      ${badgePill}
      ${headlineSvg}
      ${qtySvg}
      ${detailSvg}
      ${timingSvg}
      ${footer}
    </svg>`

  return Buffer.from(svg)
}
