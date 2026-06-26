'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not send code')
      if (data.message) setNote(data.message)
      router.push(`/verify?phone=${encodeURIComponent(phone)}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-white">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🍛</div>
        <h1 className="text-3xl font-bold">MenuDrop</h1>
        <p className="text-brand-blue-lt mt-2">
          Turn today&apos;s specials into ready-to-post images and captions.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-brand-blue-lt">
          WhatsApp number
        </label>
        <input
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input text-ui-text"
          required
        />
        {note && <p className="text-xs text-brand-blue-lt">{note}</p>}
        {error && <p className="text-sm text-amber-200">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending…' : 'Send OTP'}
        </button>
      </form>

      <p className="text-center text-xs text-brand-blue-lt mt-6">
        We&apos;ll text you a one-time code. No passwords.
      </p>
    </div>
  )
}
