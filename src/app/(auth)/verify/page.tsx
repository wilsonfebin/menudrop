'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import IndiaFlag from '@/components/ui/IndiaFlag'

function VerifyInner() {
  const router = useRouter()
  const params = useSearchParams()
  const phone = params.get('phone') ?? ''
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Invalid code')
      router.push(data.needsOnboarding ? '/onboarding' : '/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-white">
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">✉️</div>
        <h1 className="text-2xl font-bold">Enter your code</h1>
        <p className="text-brand-blue-lt mt-2 flex items-center justify-center gap-1.5 flex-wrap">
          <span>Sent to</span>
          {phone ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-white">
              <IndiaFlag /> +91 {phone}
            </span>
          ) : (
            <span>your phone</span>
          )}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="input text-ui-text text-center text-2xl tracking-[0.5em]"
          required
        />
        {error && <p className="text-sm text-amber-200">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Verifying…' : 'Verify & continue'}
        </button>
      </form>

      <button
        onClick={() => router.push('/login')}
        className="block mx-auto text-center text-xs text-brand-blue-lt mt-6"
      >
        ← Use a different number
      </button>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  )
}
