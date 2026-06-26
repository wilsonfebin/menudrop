import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyWebhookSignature } from '@/lib/razorpay'

// Razorpay webhook. MUST read the raw body (not req.json()) so the
// signature verification matches exactly.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: {
    event?: string
    payload?: { subscription?: { entity?: { id?: string; notes?: { user_id?: string } } } }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const subId = event.payload?.subscription?.entity?.id
  const userId = event.payload?.subscription?.entity?.notes?.user_id

  switch (event.event) {
    case 'subscription.activated':
    case 'subscription.charged':
      if (userId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('user_id', userId)
      }
      break
    case 'subscription.cancelled':
    case 'subscription.completed':
      if (subId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('razorpay_sub_id', subId)
      }
      break
    default:
      break
  }

  return NextResponse.json({ received: true })
}
