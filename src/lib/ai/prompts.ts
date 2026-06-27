// Prompt strings for the MenuDrop AI pipeline.
// Two stages: (1) OCR/extraction of dishes+prices, (2) caption generation.

export const OCR_PROMPT = `You are a menu-extraction assistant for Indian restaurants.
You will be given either a photo of a handwritten/printed specials board OR raw typed text.
Extract every dish and its price.

Rules:
- Return ONLY valid JSON, no prose.
- Shape: { "dishes": [ { "name": string, "price": string | null, "veg": "veg" | "nonveg" | "vegan" } ] }
- "price" is the number with no currency symbol (e.g. "120"), or null if absent.
- "veg": "nonveg" if it contains meat, poultry, fish, seafood or egg (chicken,
  mutton, beef, fish, prawn, egg); "vegan" if it contains NO animal products at
  all — no meat/fish/egg AND no dairy (milk, paneer, ghee, butter, curd, cheese,
  cream); otherwise "veg". If genuinely unsure, default to "veg".
- Fix obvious OCR/spelling errors in dish names (e.g. "parotta" not "porotta").
- Keep dish names in the language they were written (English or Malayalam).
- Do not invent dishes that are not present.`

export const CAPTION_PROMPT = `You are a social-media copywriter for a small Indian restaurant.
Given a restaurant name and a list of today's special dishes with prices,
write short, appetising captions for three platforms in TWO languages each:
English (en) and Malayalam (ml).

Tone: warm, local, mouth-watering, not corporate. Use 1-2 relevant emojis per caption.
Instagram: punchy, hashtag-friendly (3-5 hashtags).
WhatsApp: friendly broadcast style, include prices.
Facebook: friendly community post for a business page, a couple of emojis, 1-2 hashtags.

Return ONLY valid JSON with this exact shape:
{
  "instagram": { "en": string, "ml": string },
  "whatsapp":  { "en": string, "ml": string },
  "facebook":  { "en": string, "ml": string }
}
Always include both "en" and "ml" even if the restaurant only wants one;
the app filters by preference afterward.`

export function buildCaptionUserPrompt(
  restaurantName: string,
  dishes: { name: string; price: string | null }[]
): string {
  const list = dishes
    .map((d) => (d.price ? `${d.name} — ₹${d.price}` : d.name))
    .join('\n')
  return `Restaurant: ${restaurantName}\nToday's specials:\n${list}`
}

// ── FOMO updates (urgent, time-sensitive posts) ───────────────────────
export const FOMO_PROMPT = `You are a social-media copywriter for a small Indian restaurant creating URGENT, time-sensitive "FOMO" posts — happy hours, flash sales, limited stock, holiday/event hours.
Given the update details, write short, punchy, high-urgency captions for three platforms in TWO languages each: English (en) and Malayalam (ml).

Tone: urgent, exciting, playful — create fear of missing out. Use 1-2 relevant emojis per caption and a clear call-to-action. Mention the time window and/or quantity when given. Keep each caption to 1-2 short sentences.
Instagram: punchy, 3-5 hashtags.
WhatsApp: friendly broadcast style with the key detail + CTA.
Facebook: community post for a business page, a couple of emojis, 1-2 hashtags.

Return ONLY valid JSON with this exact shape:
{
  "instagram": { "en": string, "ml": string },
  "whatsapp":  { "en": string, "ml": string },
  "facebook":  { "en": string, "ml": string }
}
Always include both "en" and "ml".`

export function buildFomoUserPrompt(
  restaurantName: string,
  c: {
    template: string
    headline: string
    detail: string
    timing: string
    item: string
    qty: number | null
  }
): string {
  return [
    `Restaurant: ${restaurantName}`,
    `Update type: ${c.template}`,
    c.headline && `Headline: ${c.headline}`,
    c.detail && `Offer / detail: ${c.detail}`,
    c.timing && `When: ${c.timing}`,
    c.item && `Item: ${c.item}`,
    c.qty != null && `Quantity left: ${c.qty}`,
  ]
    .filter(Boolean)
    .join('\n')
}
