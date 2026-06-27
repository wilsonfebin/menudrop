'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/store/profile'
import { supabase } from '@/lib/supabase/client'
import { useRazorpayScript } from '@/hooks/useRazorpay'
import IndiaFlag from '@/components/ui/IndiaFlag'
import LocationField from '@/components/ui/LocationField'
import type { Plan } from '@/types'

const PLANS: { key: Exclude<Plan, 'free'>; label: string; price: number; perk: string }[] = [
  { key: 'starter', label: 'Starter', price: 199, perk: 'Unlimited posts' },
  { key: 'pro', label: 'Pro', price: 499, perk: 'Unlimited + custom branding' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-ui-text-ter uppercase tracking-wide mb-2 mt-5">
      {children}
    </h2>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ui-text-sec mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { profile, fetch: fetchProfile, update } = useProfile()
  const razorpayReady = useRazorpayScript()
  const [form, setForm] = useState({
    name: '',
    city: '',
    display_phone: '',
    maps_link: '',
    location_name: '',
    business_hours: '',
  })
  const [loginPhone, setLoginPhone] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) fetchProfile()
  }, [profile, fetchProfile])

  useEffect(() => {
    if (profile)
      setForm({
        name: profile.name ?? '',
        city: profile.city ?? '',
        // Normalise any previously-stored format to the last 10 digits.
        display_phone: (profile.display_phone ?? '').replace(/\D/g, '').slice(-10),
        maps_link: profile.maps_link ?? '',
        location_name: profile.location_name ?? '',
        business_hours: profile.business_hours ?? '',
      })
  }, [profile])

  // The login phone is the auth identity (immutable account ID), separate from
  // the editable display phone shown on posts.
  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : { login_phone: null }))
      .then((d) => setLoginPhone(d.login_phone ?? null))
      .catch(() => setLoginPhone(null))
  }, [])

  const fmtLogin = loginPhone ? `+91 ${loginPhone.replace(/\D/g, '').slice(-10)}` : null

  const initials =
    (profile?.name ?? 'MD')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'MD'

  async function save() {
    setMsg(null)
    if (form.display_phone && form.display_phone.length !== 10) {
      setErr('Enter a 10-digit mobile number')
      return
    }
    setErr(null)
    setSaving(true)
    await update(form)
    setMsg('Saved')
    setSaving(false)
    setTimeout(() => setMsg(null), 1500)
  }

  async function subscribe(plan: Exclude<Plan, 'free'>) {
    setMsg(null)
    try {
      const res = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not start checkout')

      const Razorpay = (window as unknown as { Razorpay?: new (o: object) => { open: () => void } })
        .Razorpay
      if (!razorpayReady || !Razorpay) throw new Error('Checkout not ready, try again')

      const rzp = new Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'MenuDrop',
        description: `${plan} plan`,
        handler: async (resp: Record<string, string>) => {
          await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...resp, plan }),
          })
          setMsg('Subscription active')
        },
      })
      rzp.open()
    } catch (err) {
      setMsg((err as Error).message)
    }
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
    await supabase.auth.signOut().catch(() => null)
    router.push('/login')
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold text-ui-text mb-4">Settings</h1>

      <div className="card flex items-center gap-3 p-3">
        <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-brand-blue-lt flex items-center justify-center">
          {profile?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logo_url} alt="logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-base font-extrabold text-brand-blue">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ui-text truncate">{profile?.name || 'Your restaurant'}</p>
          <p className="text-xs text-ui-text-ter truncate">
            {fmtLogin || 'Signed in'}
          </p>
        </div>
      </div>

      <SectionLabel>Restaurant details</SectionLabel>
      <div className="card p-4 space-y-3">
        <Field label="Restaurant name">
          <input
            className="input"
            placeholder="e.g. Paradise Biryani"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Address">
          <input
            className="input"
            placeholder="Street, City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </Field>
        <Field label="Location">
          <LocationField
            value={{ link: form.maps_link, name: form.location_name }}
            onChange={(v) => setForm({ ...form, maps_link: v.link, location_name: v.name })}
          />
          <p className="text-[11px] text-ui-text-ter mt-1.5">
            Captured from your device GPS. Added as a short clickable link to your shared captions.
          </p>
        </Field>
        <Field label="Display phone (shown on your posts)">
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-ui-border bg-white">
              <IndiaFlag />
            </span>
            <input
              className="input rounded-l-none flex-1 min-w-0"
              inputMode="numeric"
              placeholder="98765 43210"
              maxLength={10}
              value={form.display_phone}
              onChange={(e) =>
                setForm({ ...form, display_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
            />
          </div>
        </Field>
        <Field label="Business hours (shown on the image)">
          <input
            className="input"
            placeholder="e.g. 11:00 AM – 11:00 PM"
            value={form.business_hours}
            onChange={(e) => setForm({ ...form, business_hours: e.target.value })}
          />
        </Field>
        {fmtLogin && (
          <Field label="Login number">
            <input
              className="input bg-ui-bg text-ui-text-sec cursor-not-allowed"
              value={fmtLogin}
              disabled
              readOnly
            />
            <p className="text-[11px] text-ui-text-ter mt-1">
              The number you signed in with — your account ID. It can&apos;t be changed.
            </p>
          </Field>
        )}
        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {err && <p className="text-sm text-red-600 text-center">{err}</p>}
        {msg && <p className="text-sm text-brand-teal text-center">{msg}</p>}
      </div>

      <SectionLabel>Plan</SectionLabel>
      <p className="text-xs text-ui-text-ter mb-2 -mt-1">You&apos;re on the Free plan — 3 posts / month.</p>
      <div className="space-y-2">
        {PLANS.map((p) => (
          <div key={p.key} className="card p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ui-text">
                {p.label} <span className="text-ui-text-sec font-normal">· ₹{p.price}/mo</span>
              </p>
              <p className="text-xs text-ui-text-ter">{p.perk}</p>
            </div>
            <button onClick={() => subscribe(p.key)} className="btn-secondary py-2 px-4">
              Upgrade
            </button>
          </div>
        ))}
      </div>

      <SectionLabel>App</SectionLabel>
      <div className="space-y-2">
        <Link href="/settings/install" className="card p-3 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium text-ui-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-blue" aria-hidden="true">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
              <path d="M5 21h14" />
            </svg>
            Install MenuDrop
          </span>
          <span className="text-ui-text-ter">›</span>
        </Link>
        <button onClick={signOut} className="card p-3 w-full text-center font-medium text-red-600">
          Sign out
        </button>
      </div>
    </div>
  )
}
