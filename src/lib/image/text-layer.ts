import type { Dish, RestaurantProfile } from '@/types'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(s: string, max = 24): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

interface BuildOpts {
  dishes: Dish[]
  profile: Pick<RestaurantProfile, 'name' | 'street' | 'city' | 'display_phone'>
  width?: number
  height?: number
  textColor?: string
  accentColor?: string
  reserveLogo?: boolean
  monogram?: string | null
}

/**
 * Photo-forward poster overlay, sized to any width/height. The header is
 * top-anchored and the menu strip is bottom-anchored, so the photo fills the
 * middle — works for square (1:1), portrait (4:5) and story (9:16).
 */
export function buildTextLayer({
  dishes,
  profile,
  width = 1080,
  height = 1080,
  textColor = '#FFFFFF',
  accentColor = '#FFC65C',
  reserveLogo = false,
  monogram = null,
}: BuildOpts): Buffer {
  const W = width
  const H = height
  const top = dishes.slice(0, 8)
  const n = Math.max(top.length, 1)

  const nameMax = reserveLogo ? W - 320 : W - 140
  const nameSize = profile.name.length > 16 ? 54 : 68

  const shadow = (
    x: number, y: number, size: number, weight: number,
    anchor: string, extra: string, content: string, fill: string
  ) => `
      <text x="${x + 3}" y="${y + 3}" font-size="${size}" font-weight="${weight}"
            text-anchor="${anchor}" fill="#000000" fill-opacity="0.55"
            font-family="Helvetica, Arial, sans-serif" ${extra}>${content}</text>
      <text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}"
            text-anchor="${anchor}" fill="${fill}"
            font-family="Helvetica, Arial, sans-serif" ${extra}>${content}</text>`

  const eyebrow = shadow(148, 176, 36, 700, 'start', 'letter-spacing="6"', 'TODAY&#8217;S SPECIALS', accentColor)
  const nameEl = shadow(62, 258, nameSize, 800, 'start', `clip-path="url(#nameClip)" letter-spacing="0.5"`, escapeXml(profile.name), textColor)

  // menu strip (bottom anchored)
  const footerH = 120
  const listBottom = H - footerH
  const rowH = Math.min(78, Math.max(48, 320 / n))
  const blockH = rowH * n
  const listTop = listBottom - blockH
  const firstY = listTop + rowH * 0.7
  const priceX = W - 70
  const scrimStart = Math.max(300, listTop - 150)

  const vegMark = (x: number, cy: number, veg?: Dish['veg']) => {
    if (!veg) return ''
    const col = veg === 'veg' ? '#3FB661' : '#FF6A5A'
    const s = 28
    return `
      <rect x="${x}" y="${cy - s / 2}" width="${s}" height="${s}" rx="4"
            fill="none" stroke="${col}" stroke-width="3"/>
      <circle cx="${x + s / 2}" cy="${cy}" r="6.5" fill="${col}"/>`
  }

  const rows = top
    .map((d, i) => {
      const y = firstY + i * rowH
      const hasVeg = !!d.veg
      const nameX = hasVeg ? 122 : 70
      const name = escapeXml(truncate(d.name || '—'))
      const price = d.price ? `&#8377;${escapeXml(d.price)}` : ''
      return `
        ${vegMark(70, y - 13, d.veg)}
        <line x1="${nameX}" y1="${y + 12}" x2="${priceX}" y2="${y + 12}"
              stroke="${textColor}" stroke-opacity="0.20" stroke-width="2"
              stroke-dasharray="2 10" stroke-linecap="round"/>
        <text x="${nameX}" y="${y}" font-size="42" font-weight="600" fill="${textColor}"
              font-family="Georgia, 'Times New Roman', serif">${name}</text>
        <text x="${priceX}" y="${y}" font-size="42" font-weight="700" fill="${accentColor}"
              text-anchor="end" font-family="Georgia, 'Times New Roman', serif">${price}</text>`
    })
    .join('')

  const addressLine = escapeXml([profile.street, profile.city].filter(Boolean).join(', '))
  const phoneLine = escapeXml(profile.display_phone ?? '')
  const cx = W / 2
  const footer = `
    ${addressLine ? `<text x="${cx}" y="${H - 74}" text-anchor="middle" font-size="30" fill="${textColor}" fill-opacity="0.82" letter-spacing="1" font-family="Helvetica, Arial, sans-serif">${addressLine}</text>` : ''}
    ${phoneLine ? `<text x="${cx}" y="${H - 34}" text-anchor="middle" font-size="32" font-weight="600" fill="${textColor}" letter-spacing="1" font-family="Helvetica, Arial, sans-serif">${phoneLine}</text>` : ''}`

  const badgeFull = 170
  const badgeR = badgeFull / 2
  const badgeCx = W - badgeR - 54
  const badgeCy = 54 + badgeR
  const monoSize = (monogram?.length ?? 0) > 1 ? 56 : 64
  const monogramSvg = monogram
    ? `
      <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="#FFFFFF" fill-opacity="0.95"/>
      <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR - 10}" fill="${accentColor}"/>
      <text x="${badgeCx}" y="${badgeCy + monoSize / 3}" text-anchor="middle"
            font-size="${monoSize}" font-weight="800" fill="#1A1917"
            font-family="Helvetica, Arial, sans-serif" letter-spacing="1">${escapeXml(monogram)}</text>`
    : ''

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000000" stop-opacity="0.60"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="botScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#080A12" stop-opacity="0"/>
          <stop offset="0.45" stop-color="#080A12" stop-opacity="0.72"/>
          <stop offset="1" stop-color="#080A12" stop-opacity="0.92"/>
        </linearGradient>
        <clipPath id="nameClip"><rect x="0" y="186" width="${nameMax}" height="110"/></clipPath>
      </defs>

      <rect x="0" y="0" width="${W}" height="340" fill="url(#topScrim)"/>
      <rect x="0" y="${scrimStart}" width="${W}" height="${H - scrimStart}" fill="url(#botScrim)"/>

      <rect x="64" y="166" width="74" height="7" rx="3.5" fill="${accentColor}"/>
      ${eyebrow}
      ${nameEl}
      ${monogramSvg}

      ${rows}
      ${footer}
    </svg>`

  return Buffer.from(svg)
}
