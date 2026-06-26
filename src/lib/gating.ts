import { supabaseAdmin } from '@/lib/supabase/admin'
import { startOfMonth } from 'date-fns'
import { credsReady } from '@/lib/utils/env'
import type { Plan } from '@/types'

export const FREE_MONTHLY_LIMIT = 3

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
}

export async function checkCanPost(
  userId: string
): Promise<{ allowed: boolean; reason?: string; plan: Plan; used?: number }> {
  if (!credsReady.supabase()) {
    return { allowed: true, plan: 'free' }
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle()

  const plan = ((sub?.plan as Plan) ?? 'free') as Plan
  if (plan !== 'free') {
    return { allowed: true, plan }
  }

  const { count } = await supabaseAdmin
    .from('post_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth(new Date()).toISOString())

  const used = count ?? 0
  if (used >= FREE_MONTHLY_LIMIT) {
    return { allowed: false, reason: 'free_limit_reached', plan, used }
  }
  return { allowed: true, plan, used }
}
