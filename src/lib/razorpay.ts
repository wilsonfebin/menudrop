import Razorpay from 'razorpay'
import crypto from 'crypto'
import { credsReady } from '@/lib/utils/env'
import type { Plan } from '@/types'

let cached: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!credsReady.razorpay()) throw new Error('Razorpay not configured')
  if (!cached) {
    cached = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }
  return cached
}

export const PLAN_TO_RAZORPAY_ID: Record<Exclude<Plan, 'free'>, string | undefined> = {
  starter: process.env.RAZORPAY_STARTER_PLAN_ID,
  pro: process.env.RAZORPAY_PRO_PLAN_ID,
}

export const PLAN_PRICING: Record<Plan, { label: string; price: number; posts: string }> = {
  free: { label: 'Free', price: 0, posts: '3 posts / month' },
  starter: { label: 'Starter', price: 199, posts: 'Unlimited posts' },
  pro: { label: 'Pro', price: 499, posts: 'Unlimited + branding' },
}

/** Verify a Razorpay checkout signature (order/payment handshake). */
export function verifyPaymentSignature(
  orderOrSubId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${paymentId}|${orderOrSubId}`)
    .digest('hex')
  return expected === signature
}

/** Verify a Razorpay webhook signature against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  return expected === signature
}
