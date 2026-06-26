import OpenAI from 'openai'
import { credsReady } from '@/lib/utils/env'

let cached: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!credsReady.openai()) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  if (!cached) {
    cached = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return cached
}

export const TEXT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
export const VISION_MODEL = process.env.OPENAI_VISION_MODEL ?? 'gpt-4o'
