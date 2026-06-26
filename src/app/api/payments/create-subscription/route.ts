import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { getRazorpay, PLAN_TO_RAZORPAY_ID } from '@/lib/razorpay'
import { credsReady } from '@/lib/utils/env'
import type { Plan } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { plan?: Plan }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const plan = body.plan
  if (plan !== 'starter' && plan !== 'pro') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!credsReady.razorpay()) {
    return NextResponse.json(
      { error: 'Razorpay not configured. Add RAZORPAY_* keys to .env.local.' },
      { status: 503 }
    )
  }

  const planId = PLAN_TO_RAZORPAY_ID[plan]
  if (!planId) {
    return NextResponse.json({ error: `Plan id for ${plan} not set` }, { status: 500 })
  }

  try {
    const razorpay = getRazorpay()
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      notes: { user_id: session.user.id, plan },
    })
    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('[api/payments/create-subscription]', error)
    return NextResponse.json({ error: 'Could not create subscription' }, { status: 500 })
  }
}
