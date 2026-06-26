import { getOpenAI, TEXT_MODEL } from '@/lib/ai/client'
import { CAPTION_PROMPT, buildCaptionUserPrompt } from '@/lib/ai/prompts'
import { withRetry } from '@/lib/utils/retry'
import type { Dish, PostCaptions } from '@/types'

const EMPTY: PostCaptions = {
  instagram: { en: '', ml: '' },
  whatsapp: { en: '', ml: '' },
  facebook: { en: '', ml: '' },
}

export async function generateCaptions(
  restaurantName: string,
  dishes: Dish[]
): Promise<PostCaptions> {
  const openai = getOpenAI()
  return withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: TEXT_MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CAPTION_PROMPT },
        {
          role: 'user',
          content: buildCaptionUserPrompt(
            restaurantName,
            dishes.map((d) => ({ name: d.name, price: d.price }))
          ),
        },
      ],
    })
    const content = res.choices[0]?.message?.content ?? '{}'
    const cleaned = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<PostCaptions>
    return {
      instagram: { ...EMPTY.instagram, ...parsed.instagram },
      whatsapp: { ...EMPTY.whatsapp, ...parsed.whatsapp },
      facebook: { ...EMPTY.facebook, ...parsed.facebook },
    }
  })
}
