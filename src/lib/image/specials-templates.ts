import type { Dish, RestaurantProfile, SpecialsTemplate } from '@/types'

// ──────────────────────────────────────────────────────────────────────
// Themed "Today's Specials" poster layouts.
//
// One layout engine, several colour themes. Structure (top → bottom):
//   logo badge · "Today's" script · "SPECIALS" · tagline ·
//   featured-dish ribbon · dotted-leader price list · hero photo band ·
//   themed footer (place / phone).
//
// Output is a single self-contained SVG string (photo + logo embedded as
// data URIs by the caller) so it rasterises in one pass with Sharp, and is
// previewable with any SVG renderer.
// ──────────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "Helvetica, Arial, sans-serif"
const HEAVY = "'Arial Black', Helvetica, Arial, sans-serif"

interface Theme {
  bg: { from: string; to: string } // diagonal gradient (set from===to for flat)
  decor: 'leaf' | 'gold' | 'chalk' | 'spark'
  script: string // "Today's"
  specials: string // "SPECIALS"
  tagline: string // default tagline text
  taglineColor: string
  rule: string // small flourish rules / divider
  accent: string // ribbon fill + prices
  ribbonStyle: 'pill' | 'underline'
  ribbonText: string // text colour inside a filled pill
  listName: string
  price: string
  leader: string // dotted leader colour
  leaderOp: number
  iconStroke: string
  footer: { style: 'bar' | 'overlay'; bar?: string; text: string; phone: string }
  photoFade: string // colour the photo top fades into (≈ bg.to)
}

const THEMES: Record<Exclude<SpecialsTemplate, 'classic'>, Theme> = {
  midnight: {
    bg: { from: '#1B1A14', to: '#0E0D09' },
    decor: 'spark',
    script: '#FFFFFF',
    specials: '#F0871E',
    tagline: 'Good food. Good mood.',
    taglineColor: '#EFE7DA',
    rule: '#F0871E',
    accent: '#F0871E',
    ribbonStyle: 'underline',
    ribbonText: '#14130F',
    listName: '#F3EFE7',
    price: '#F7A23F',
    leader: '#FFFFFF',
    leaderOp: 0.3,
    iconStroke: '#F0871E',
    footer: { style: 'overlay', text: '#FFE7C9', phone: '#F7A23F' },
    photoFade: '#0E0D09',
  },
  botanic: {
    bg: { from: '#F6F2E8', to: '#ECE6D6' },
    decor: 'leaf',
    script: '#1F5A3A',
    specials: '#1F5A3A',
    tagline: 'Good food. Good mood.',
    taglineColor: '#3D4A3F',
    rule: '#3E8E5E',
    accent: '#2E7D4F',
    ribbonStyle: 'pill',
    ribbonText: '#FFFFFF',
    listName: '#2A2722',
    price: '#1F5A3A',
    leader: '#2A2722',
    leaderOp: 0.28,
    iconStroke: '#2E7D4F',
    footer: { style: 'bar', bar: '#1F5A3A', text: '#EAF3EC', phone: '#FFFFFF' },
    photoFade: '#ECE6D6',
  },
  maroon: {
    bg: { from: '#4A1316', to: '#220809' },
    decor: 'gold',
    script: '#F4E9D6',
    specials: '#F6ECDB',
    tagline: 'Fresh. Hot. Delicious.',
    taglineColor: '#E9D9BE',
    rule: '#E3B860',
    accent: '#E3B860',
    ribbonStyle: 'pill',
    ribbonText: '#3A0E10',
    listName: '#F2E7D6',
    price: '#E8C374',
    leader: '#F2E7D6',
    leaderOp: 0.32,
    iconStroke: '#E3B860',
    footer: { style: 'overlay', text: '#F0E2C8', phone: '#E8C374' },
    photoFade: '#220809',
  },
  chalk: {
    bg: { from: '#23231F', to: '#161613' },
    decor: 'chalk',
    script: '#F2A65A',
    specials: '#ECE9E2',
    tagline: 'Freshly cooked happiness.',
    taglineColor: '#D7D3C8',
    rule: '#E08A3C',
    accent: '#E08A3C',
    ribbonStyle: 'underline',
    ribbonText: '#1B1B19',
    listName: '#ECE9E2',
    price: '#EFA85A',
    leader: '#ECE9E2',
    leaderOp: 0.34,
    iconStroke: '#E08A3C',
    footer: { style: 'overlay', text: '#E7E3D8', phone: '#EFA85A' },
    photoFade: '#161613',
  },
}

export function isTemplate(t: string | undefined | null): t is Exclude<SpecialsTemplate, 'classic'> {
  return t === 'midnight' || t === 'botanic' || t === 'maroon' || t === 'chalk'
}

interface BuildOpts {
  template: Exclude<SpecialsTemplate, 'classic'>
  dishes: Dish[]
  profile: Pick<
    RestaurantProfile,
    'name' | 'street' | 'city' | 'display_phone' | 'location_name' | 'business_hours'
  >
  width: number
  height: number
  photoHref: string | null // data URI of the (already cover-cropped) hero photo
  logoHref: string | null // data URI of the round logo, or null for monogram
  monogram?: string | null
}

const estW = (text: string, size: number) => text.length * size * 0.56

/** Build the full poster SVG for a themed specials template. */
export function buildSpecialsTemplate({
  template,
  dishes,
  profile,
  width,
  height,
  photoHref,
  logoHref,
  monogram = null,
}: BuildOpts): string {
  const W = width
  const H = height
  const t = THEMES[template]
  const cx = W / 2
  const pad = Math.round(W * 0.06)

  // ── vertical anchors (fractions of H so it adapts across formats) ────
  const bandH = Math.round(H * 0.34)
  const bandY = H - bandH
  const logoR = Math.round(H * 0.044)
  const logoCy = Math.round(H * 0.038) + logoR
  const todaysSize = Math.round(H * 0.03)
  const todaysY = logoCy + logoR + Math.round(H * 0.034)
  const specialsSize = Math.round(H * 0.056)
  const specialsY = todaysY + specialsSize + Math.round(H * 0.002)
  const taglineSize = Math.round(H * 0.0145)
  const taglineY = specialsY + Math.round(H * 0.026)
  const ribbonCy = taglineY + Math.round(H * 0.044)
  const ribbonH = Math.round(H * 0.044)

  const listTop = ribbonCy + Math.round(H * 0.05)
  const listBottom = bandY - Math.round(H * 0.03)
  const listSpan = Math.max(1, listBottom - listTop)

  const maxRows = Math.max(2, Math.min(8, Math.floor(listSpan / (H * 0.046))))
  const rows = dishes.filter((d) => (d.name || '').trim()).slice(0, maxRows)
  const n = Math.max(rows.length, 1)
  const rowH = listSpan / n
  const rowSize = Math.min(Math.round(H * 0.026), Math.round(rowH * 0.46))

  // ── background ───────────────────────────────────────────────────────
  const flat = t.bg.from === t.bg.to
  const bg = flat
    ? `<rect width="${W}" height="${H}" fill="${t.bg.from}"/>`
    : `<rect width="${W}" height="${H}" fill="url(#bgG)"/>`

  // ── decorative motifs (kept subtle) ─────────────────────────────────
  const decor = buildDecor(t, W, H)

  // ── logo badge / monogram (top centre) ──────────────────────────────
  const ringR = logoR + Math.round(logoR * 0.085)
  let logoSvg: string
  if (logoHref) {
    logoSvg = `
      <circle cx="${cx}" cy="${logoCy}" r="${ringR}" fill="#FFFFFF" fill-opacity="0.95"/>
      <image href="${logoHref}" x="${cx - logoR}" y="${logoCy - logoR}" width="${logoR * 2}" height="${logoR * 2}"
             preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)"/>`
  } else {
    const mono = (monogram || '').trim() || '·'
    const ms = mono.length > 1 ? logoR * 0.85 : logoR * 1.05
    logoSvg = `
      <circle cx="${cx}" cy="${logoCy}" r="${ringR}" fill="#FFFFFF" fill-opacity="0.95"/>
      <circle cx="${cx}" cy="${logoCy}" r="${logoR}" fill="${t.accent}"/>
      <text x="${cx}" y="${logoCy + ms * 0.34}" text-anchor="middle" font-size="${ms}" font-weight="800"
            fill="${t.ribbonText}" font-family="${SANS}">${escapeXml(mono)}</text>`
  }

  // ── header text ─────────────────────────────────────────────────────
  const todays = `
    <text x="${cx}" y="${todaysY}" text-anchor="middle" font-size="${todaysSize}" font-style="italic"
          font-family="${SERIF}" fill="${t.script}">Today&#8217;s</text>`
  const specials = `
    <text x="${cx}" y="${specialsY}" text-anchor="middle" font-size="${specialsSize}" font-weight="800"
          letter-spacing="${specialsSize * 0.04}" font-family="${HEAVY}" fill="${t.specials}">SPECIALS</text>`

  const taglineText = (t.tagline || '').toUpperCase()
  // wider estimate: uppercase + letter-spacing makes the line longer
  const tlW = taglineText.length * taglineSize * 0.82
  const tagline = taglineText
    ? `
    <text x="${cx}" y="${taglineY}" text-anchor="middle" font-size="${taglineSize}" font-weight="600"
          letter-spacing="${taglineSize * 0.18}" font-family="${SANS}" fill="${t.taglineColor}">${escapeXml(taglineText)}</text>
    <line x1="${cx - tlW / 2 - 34}" y1="${taglineY - taglineSize * 0.35}" x2="${cx - tlW / 2 - 12}" y2="${taglineY - taglineSize * 0.35}" stroke="${t.rule}" stroke-width="2"/>
    <line x1="${cx + tlW / 2 + 12}" y1="${taglineY - taglineSize * 0.35}" x2="${cx + tlW / 2 + 34}" y2="${taglineY - taglineSize * 0.35}" stroke="${t.rule}" stroke-width="2"/>`
    : ''

  // ── restaurant-name ribbon (the brand line) ─────────────────────────
  const brandName = truncate((profile.name || '').trim(), 28)
  const ribbon = brandName ? buildRibbon(t, brandName, cx, ribbonCy, ribbonH, W, pad) : ''

  // ── price list with dotted leaders ──────────────────────────────────
  const listLeft = pad + Math.round(W * 0.02)
  const priceX = W - pad - Math.round(W * 0.02)
  const iconR = Math.round(rowSize * 0.62)
  const firstBaseline = listTop + rowH * 0.62

  const list = rows
    .map((d, i) => {
      const y = Math.round(firstBaseline + i * rowH)
      const icon = buildRowIcon(t, listLeft + iconR, y - rowSize * 0.32, iconR, d.veg)
      const nameX = listLeft + iconR * 2 + Math.round(W * 0.022)
      const name = escapeXml(truncate((d.name || '—').trim(), 26))
      const price = d.price ? `&#8377;${escapeXml(d.price)}` : ''
      return `
        ${icon}
        <line x1="${nameX}" y1="${y + rowSize * 0.32}" x2="${priceX}" y2="${y + rowSize * 0.32}"
              stroke="${t.leader}" stroke-opacity="${t.leaderOp}" stroke-width="2"
              stroke-dasharray="1 8" stroke-linecap="round"/>
        <text x="${nameX}" y="${y}" font-size="${rowSize}" font-weight="600" fill="${t.listName}"
              font-family="${SANS}">${name}</text>
        ${
          price
            ? `<text x="${priceX}" y="${y}" font-size="${rowSize}" font-weight="800" fill="${t.price}"
              text-anchor="end" font-family="${SANS}">${price}</text>`
            : ''
        }`
    })
    .join('')

  // ── hero photo band (rounded top corners) + soft top fade ───────────
  const corner = Math.round(W * 0.045)
  const photo = photoHref
    ? `<image href="${photoHref}" x="0" y="${bandY}" width="${W}" height="${bandH}"
             preserveAspectRatio="xMidYMid slice" clip-path="url(#bandClip)"/>`
    : `<rect x="0" y="${bandY}" width="${W}" height="${bandH}" fill="url(#bgG)" clip-path="url(#bandClip)"/>
       <circle cx="${cx}" cy="${bandY + bandH * 0.5}" r="${bandH * 0.28}" fill="#FFFFFF" fill-opacity="0.05"/>`
  const photoFade = `
    <rect x="0" y="${bandY}" width="${W}" height="${Math.round(bandH * 0.22)}" fill="url(#fadeTop)" clip-path="url(#bandClip)"/>`

  // ── footer (place / phone) ──────────────────────────────────────────
  const footer = buildFooter(t, profile, W, H, bandH, bandY, cx, pad, corner)

  const gradients = `
    <defs>
      ${
        flat
          ? `<linearGradient id="bgG"><stop offset="0" stop-color="${t.bg.from}"/></linearGradient>`
          : `<linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1">
               <stop offset="0" stop-color="${t.bg.from}"/>
               <stop offset="1" stop-color="${t.bg.to}"/>
             </linearGradient>`
      }
      <linearGradient id="fadeTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${t.photoFade}" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${t.photoFade}" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="footScrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0.66"/>
      </linearGradient>
      <clipPath id="logoClip"><circle cx="${cx}" cy="${logoCy}" r="${logoR}"/></clipPath>
      <clipPath id="bandClip">
        <path d="M0 ${bandY + corner} Q0 ${bandY} ${corner} ${bandY} H${W - corner} Q${W} ${bandY} ${W} ${
    bandY + corner
  } V${H} H0 Z"/>
      </clipPath>
    </defs>`

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    ${gradients}
    ${bg}
    ${decor}
    ${photo}
    ${photoFade}
    ${logoSvg}
    ${todays}
    ${specials}
    ${tagline}
    ${ribbon}
    ${list}
    ${footer}
  </svg>`
}

// ── pieces ────────────────────────────────────────────────────────────

function buildRibbon(
  t: Theme,
  text: string,
  cx: number,
  cy: number,
  h: number,
  W: number,
  pad: number
): string {
  const size = Math.round(h * 0.5)
  const safe = escapeXml(text)
  if (t.ribbonStyle === 'pill') {
    const w = Math.min(W - pad * 2, estW(text, size) + h * 2.2)
    const x = cx - w / 2
    const r = h / 2
    const tail = h * 0.26
    const ty = h * 0.3
    return `
      <path d="M${x - tail} ${cy} L${x} ${cy - ty} L${x} ${cy + ty} Z" fill="${t.accent}" fill-opacity="0.8"/>
      <path d="M${x + w + tail} ${cy} L${x + w} ${cy - ty} L${x + w} ${cy + ty} Z" fill="${t.accent}" fill-opacity="0.8"/>
      <rect x="${x}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${r}" fill="${t.accent}"/>
      <text x="${cx}" y="${cy + size * 0.34}" text-anchor="middle" font-size="${size}" font-weight="700"
            font-family="${SANS}" fill="${t.ribbonText}">${safe}</text>`
  }
  // underline style: italic-serif title with side rules + a small diamond accent
  const tw = estW(text, size)
  const ruleY = cy + size * 0.5
  const diamond = (dx: number) =>
    `<path d="M${dx} ${ruleY - 5} L${dx + 5} ${ruleY} L${dx} ${ruleY + 5} L${dx - 5} ${ruleY} Z" fill="${t.rule}"/>`
  return `
    <text x="${cx}" y="${cy + size * 0.18}" text-anchor="middle" font-size="${size}" font-style="italic"
          font-weight="700" font-family="${SERIF}" fill="${t.accent}">${safe}</text>
    <line x1="${cx - tw / 2 - 58}" y1="${ruleY}" x2="${cx - tw / 2 - 22}" y2="${ruleY}" stroke="${t.rule}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="${cx + tw / 2 + 22}" y1="${ruleY}" x2="${cx + tw / 2 + 58}" y2="${ruleY}" stroke="${t.rule}" stroke-width="2.5" stroke-linecap="round"/>
    ${diamond(cx - tw / 2 - 64)}
    ${diamond(cx + tw / 2 + 64)}`
}

function buildRowIcon(t: Theme, cxm: number, cy: number, r: number, veg?: Dish['veg']): string {
  if (veg) {
    const s = r * 1.9
    const col = veg === 'nonveg' ? '#FF6A5A' : '#3FB661'
    const box = `<rect x="${cxm - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" rx="3" fill="none" stroke="${col}" stroke-width="2.5"/>`
    let inner = ''
    if (veg === 'veg') inner = `<circle cx="${cxm}" cy="${cy}" r="${r * 0.42}" fill="${col}"/>`
    else if (veg === 'nonveg') {
      const tt = r * 0.5
      inner = `<polygon points="${cxm},${cy - tt} ${cxm - tt},${cy + tt * 0.85} ${cxm + tt},${cy + tt * 0.85}" fill="${col}"/>`
    } else inner = `<ellipse cx="${cxm}" cy="${cy}" rx="${r * 0.3}" ry="${r * 0.55}" transform="rotate(45 ${cxm} ${cy})" fill="${col}"/>`
    return box + inner
  }
  // plain themed chip: a small ring with a centre dot
  return `
    <circle cx="${cxm}" cy="${cy}" r="${r}" fill="none" stroke="${t.iconStroke}" stroke-width="2" stroke-opacity="0.85"/>
    <circle cx="${cxm}" cy="${cy}" r="${r * 0.28}" fill="${t.iconStroke}"/>`
}

function buildFooter(
  t: Theme,
  profile: BuildOpts['profile'],
  W: number,
  H: number,
  bandH: number,
  bandY: number,
  cx: number,
  pad: number,
  corner: number
): string {
  const place =
    profile.location_name && profile.location_name.trim()
      ? profile.location_name.trim()
      : [profile.street, profile.city].filter(Boolean).join(', ')
  const hours = (profile.business_hours ?? '').trim()
  const phone = (profile.display_phone ?? '').trim()

  const placeLine = escapeXml(truncate(place, 34))
  const hoursLine = escapeXml(truncate(hours, 30))
  const phoneLine = escapeXml(phone ? `+91 ${phone}` : '')

  const lines: { text: string; size: number; weight: number; fill: string; pin?: boolean }[] = []
  if (placeLine) lines.push({ text: placeLine, size: Math.round(H * 0.0165), weight: 500, fill: t.footer.text, pin: true })
  if (hoursLine) lines.push({ text: hoursLine, size: Math.round(H * 0.0155), weight: 500, fill: t.footer.text })
  if (phoneLine) lines.push({ text: phoneLine, size: Math.round(H * 0.02), weight: 800, fill: t.footer.phone })
  if (!lines.length) return ''

  const lineH = Math.round(H * 0.032)

  if (t.footer.style === 'bar') {
    const barH = lines.length * lineH + Math.round(H * 0.022)
    const barY = H - barH
    const startY = barY + Math.round(H * 0.03)
    const body = lines
      .map((ln, i) => footerLine(ln, cx, startY + i * lineH))
      .join('')
    return `
      <path d="M${corner} ${barY} H${W - corner} Q${W} ${barY} ${W} ${barY + corner} V${H} H0 V${barY + corner} Q0 ${barY} ${corner} ${barY} Z"
            fill="${t.footer.bar}"/>
      ${body}`
  }

  // overlay style: scrim over the bottom of the photo
  const scrimH = Math.round(bandH * 0.5)
  const startY = H - lines.length * lineH + Math.round(lineH * 0.4)
  const body = lines.map((ln, i) => footerLine(ln, cx, startY + i * lineH)).join('')
  return `
    <rect x="0" y="${H - scrimH}" width="${W}" height="${scrimH}" fill="url(#footScrim)" clip-path="url(#bandClip)"/>
    ${body}`
}

function footerLine(
  ln: { text: string; size: number; weight: number; fill: string; pin?: boolean },
  cx: number,
  y: number
): string {
  const pin = ln.pin
    ? `<g transform="translate(${cx - estW(ln.text, ln.size) / 2 - ln.size * 1.1}, ${y - ln.size * 0.78})">
         <path d="M${ln.size * 0.5} 0 C${ln.size * 0.84} 0 ${ln.size * 1.05} ${ln.size * 0.26} ${ln.size * 1.05} ${ln.size * 0.56} C${ln.size * 1.05} ${ln.size * 0.92} ${ln.size * 0.5} ${ln.size * 1.2} ${ln.size * 0.5} ${ln.size * 1.2} C${ln.size * 0.5} ${ln.size * 1.2} 0 ${ln.size * 0.92} 0 ${ln.size * 0.56} C0 ${ln.size * 0.26} ${ln.size * 0.16} 0 ${ln.size * 0.5} 0 Z" fill="${ln.fill}"/>
         <circle cx="${ln.size * 0.5}" cy="${ln.size * 0.55}" r="${ln.size * 0.2}" fill="#000" fill-opacity="0.35"/>
       </g>`
    : ''
  return `${pin}
    <text x="${cx}" y="${y}" text-anchor="middle" font-size="${ln.size}" font-weight="${ln.weight}"
          font-family="${SANS}" fill="${ln.fill}" letter-spacing="0.3">${ln.text}</text>`
}

function buildDecor(t: Theme, W: number, H: number): string {
  const c = t.rule
  if (t.decor === 'leaf') {
    const leaf = (x: number, y: number, rot: number) =>
      `<g transform="translate(${x} ${y}) rotate(${rot})" stroke="${c}" stroke-width="2.5" fill="none" stroke-opacity="0.5">
         <path d="M0 0 Q40 -34 96 -20 Q56 22 0 0 Z"/>
         <path d="M6 -2 Q48 -14 86 -19"/>
       </g>`
    return `
      ${leaf(W - 150, 120, 8)}
      ${leaf(W - 96, 168, 64)}
      ${leaf(150, 120, 172)}
      ${leaf(96, 168, 116)}`
  }
  if (t.decor === 'gold') {
    const m = Math.round(W * 0.045)
    const L = Math.round(W * 0.07)
    return `
      <g stroke="${c}" stroke-width="2.5" fill="none" stroke-opacity="0.7">
        <path d="M${m} ${m + L} V${m} H${m + L}"/>
        <path d="M${W - m} ${m + L} V${m} H${W - m - L}"/>
      </g>`
  }
  if (t.decor === 'chalk') {
    return `
      <g stroke="${c}" stroke-width="2" stroke-opacity="0.45" stroke-linecap="round" fill="none">
        <path d="M${W * 0.5 - 120} ${H * 0.082} q60 -16 120 0" stroke-dasharray="2 9"/>
        <path d="M${W * 0.5 - 90} ${H * 0.092} q40 10 90 0" stroke-dasharray="2 9"/>
      </g>`
  }
  // spark: subtle warm glow + tiny accent specks
  return `
    <circle cx="${W * 0.5}" cy="${H * 0.16}" r="${W * 0.5}" fill="${t.accent}" fill-opacity="0.05"/>
    <g fill="${t.accent}" fill-opacity="0.5">
      <circle cx="${W * 0.16}" cy="${H * 0.07}" r="3"/>
      <circle cx="${W * 0.86}" cy="${H * 0.09}" r="3"/>
      <circle cx="${W * 0.8}" cy="${H * 0.05}" r="2"/>
    </g>`
}
