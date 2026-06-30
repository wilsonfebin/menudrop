import { getOpenAI, TEXT_MODEL } from '@/lib/ai/client'
import { buildFomoSystemPrompt, buildFomoUserPrompt } from '@/lib/ai/prompts'
import { withRetry } from '@/lib/utils/retry'
import { LANGUAGES } from '@/types'
import type { FomoContent, LangCode, PostCaptions } from '@/types'

export async function generateFomoCaptions(
  restaurantName: string,
  content: FomoContent,
  lang: LangCode = 'ml'
): Promise<PostCaptions> {
  const languageName = LANGUAGES[lang] ?? LANGUAGES.ml
  const empty = { en: '', local: '' }
  const openai = getOpenAI()
  return withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: TEXT_MODEL,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildFomoSystemPrompt(languageName) },
        { role: 'user', content: buildFomoUserPrompt(restaurantName, content) },
      ],
    })
    const raw = res.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(
      raw.replace(/```json|```/g, '').trim()
    ) as Partial<Omit<PostCaptions, 'lang'>>
    return {
      lang,
      instagram: { ...empty, ...parsed.instagram },
      whatsapp: { ...empty, ...parsed.whatsapp },
      facebook: { ...empty, ...parsed.facebook },
    }
  })
}
