import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPaymentSignature } from '@/lib/razorpay'
import type { Plan } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    razorpay_subscription_id?: string
    razorpay_payment_id?: string
    razorpay_signature?: string
    plan?: Plan
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature, plan } = body
  if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
  }

  const valid = verifyPaymentSignature(
    razorpay_subscription_id,
    razorpay_payment_id,
    razorpay_signature
  )
  if (!valid) {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
  }

  // Activate the subscription (service-role write, bypasses RLS).
  await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: session.user.id,
      plan: (plan ?? 'starter') as Plan,
      razorpay_sub_id: razorpay_subscription_id,
      status: 'active',
    },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ success: true })
}
