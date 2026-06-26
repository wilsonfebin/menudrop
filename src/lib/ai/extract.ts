import { getOpenAI, TEXT_MODEL, VISION_MODEL } from '@/lib/ai/client'
import { OCR_PROMPT } from '@/lib/ai/prompts'
import { withRetry } from '@/lib/utils/retry'
import type { Dish } from '@/types'

interface RawDish {
  name: string
  price: string | null
}

function toDishes(raw: RawDish[]): Dish[] {
  return raw
    .filter((d) => d.name && d.name.trim().length > 0)
    .map((d) => ({
      name: d.name.trim(),
      price: d.price != null ? String(d.price).replace(/[^\d.]/g, '') || null : null,
      corrected: false,
      original: d.name.trim(),
      veg: null,
    }))
}

function parseDishes(content: string): Dish[] {
  const cleaned = content.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(cleaned) as { dishes?: RawDish[] }
  return toDishes(parsed.dishes ?? [])
}

/** Extract dishes from typed text. */
export async function extractFromText(text: string): Promise<Dish[]> {
  const openai = getOpenAI()
  return withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: TEXT_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: OCR_PROMPT },
        { role: 'user', content: text },
      ],
    })
    return parseDishes(res.choices[0]?.message?.content ?? '{"dishes":[]}')
  })
}

/** Extract dishes from a board photo (base64 data URI). */
export async function extractFromImage(dataUri: string): Promise<Dish[]> {
  const openai = getOpenAI()
  return withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: OCR_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the dishes and prices from this specials board.' },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
    })
    return parseDishes(res.choices[0]?.message?.content ?? '{"dishes":[]}')
  })
}
