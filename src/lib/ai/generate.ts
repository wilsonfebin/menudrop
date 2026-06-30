import { getOpenAI, TEXT_MODEL } from '@/lib/ai/client'
import { buildCaptionSystemPrompt, buildCaptionUserPrompt } from '@/lib/ai/prompts'
import { withRetry } from '@/lib/utils/retry'
import { LANGUAGES } from '@/types'
import type { Dish, LangCode, PostCaptions } from '@/types'

export async function generateCaptions(
  restaurantName: string,
  dishes: Dish[],
  lang: LangCode = 'ml'
): Promise<PostCaptions> {
  const languageName = LANGUAGES[lang] ?? LANGUAGES.ml
  const empty = { en: '', local: '' }
  const openai = getOpenAI()
  return withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: TEXT_MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildCaptionSystemPrompt(languageName) },
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
    const parsed = JSON.parse(cleaned) as Partial<Omit<PostCaptions, 'lang'>>
    return {
      lang,
      instagram: { ...empty, ...parsed.instagram },
      whatsapp: { ...empty, ...parsed.whatsapp },
      facebook: { ...empty, ...parsed.facebook },
    }
  })
}
