import { getOpenAI, TEXT_MODEL } from '@/lib/ai/client'
import { FOMO_PROMPT, buildFomoUserPrompt } from '@/lib/ai/prompts'
import { withRetry } from '@/lib/utils/retry'
import type { FomoContent, PostCaptions } from '@/types'

const EMPTY: PostCaptions = {
  instagram: { en: '', ml: '' },
  whatsapp: { en: '', ml: '' },
  facebook: { en: '', ml: '' },
}

export async function generateFomoCaptions(
  restaurantName: string,
  content: FomoContent
): Promise<PostCaptions> {
  const openai = getOpenAI()
  return withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: TEXT_MODEL,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: FOMO_PROMPT },
        { role: 'user', content: buildFomoUserPrompt(restaurantName, content) },
      ],
    })
    const raw = res.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as Partial<PostCaptions>
    return {
      instagram: { ...EMPTY.instagram, ...parsed.instagram },
      whatsapp: { ...EMPTY.whatsapp, ...parsed.whatsapp },
      facebook: { ...EMPTY.facebook, ...parsed.facebook },
    }
  })
}
