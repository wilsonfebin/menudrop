import { getOpenAI, TEXT_MODEL, VISION_MODEL } from '@/lib/ai/client'
import { OCR_PROMPT } from '@/lib/ai/prompts'
import { withRetry } from '@/lib/utils/retry'
import type { Dish } from '@/types'

interface RawDish {
  name: string
  price: string | null
  veg?: string | null
}

// Keyword fallback when the model doesn't classify a dish. Matches common
// English and Malayalam non-veg terms; defaults to veg otherwise.
const NONVEG_EN = [
  'chicken', 'mutton', 'beef', 'fish', 'prawn', 'shrimp', 'egg', 'meat', 'lamb',
  'pork', 'crab', 'squid', 'duck', 'quail', 'liver', 'seafood', 'tuna', 'sardine',
  'mackerel', 'anchovy', 'clam', 'mussel', 'kebab', 'tikka', 'meen', 'irachi',
  'kozhi', 'mutta', 'chemmeen', 'aatu', 'pothu', 'kada', 'tharavu',
]
const NONVEG_ML = ['മീൻ', 'ഇറച്ചി', 'കോഴി', 'മുട്ട', 'ചെമ്മീൻ', 'ബീഫ്', 'ആട്', 'താറാവ്']

function classifyVeg(name: string): 'veg' | 'nonveg' {
  const lower = name.toLowerCase()
  if (NONVEG_EN.some((k) => lower.includes(k))) return 'nonveg'
  if (NONVEG_ML.some((k) => name.includes(k))) return 'nonveg'
  return 'veg'
}

function normalizeVeg(v: string | null | undefined): 'veg' | 'nonveg' | 'vegan' | null {
  if (!v) return null
  const s = v.toLowerCase()
  if (s.startsWith('non')) return 'nonveg'
  if (s === 'vegan') return 'vegan'
  if (s === 'veg' || s === 'vegetarian') return 'veg'
  return null
}

function toDishes(raw: RawDish[]): Dish[] {
  return raw
    .filter((d) => d.name && d.name.trim().length > 0)
    .map((d) => {
      const name = d.name.trim()
      // Prefer the model's classification; fall back to the keyword heuristic.
      const veg = normalizeVeg(d.veg) ?? classifyVeg(name)
      return {
        name,
        price: d.price != null ? String(d.price).replace(/[^\d.]/g, '') || null : null,
        corrected: false,
        original: name,
        veg,
      }
    })
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
