'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import IndiaFlag from '@/components/ui/IndiaFlag'
import LocationField from '@/components/ui/LocationField'

export default function OnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    city: '',
    display_phone: '',
    maps_link: '',
    location_name: '',
    caption_language: 'both' as 'en' | 'ml' | 'both',
  })
  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.display_phone && form.display_phone.length !== 10) {
      setError('Enter a 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Could not save profile')
      }
      if (logo) {
        await fetch('/api/profile/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: logo }),
        }).catch(() => null) // logo is optional; ignore upload failures
      }
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5">
      <TopBar title="Setup" />
      <h1 className="text-2xl font-bold text-ui-text mb-1">Set up your restaurant</h1>
      <p className="text-ui-text-sec mb-6">Takes about a minute.</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <div className="h-20 w-20 rounded-card border border-dashed border-ui-border bg-white flex items-center justify-center overflow-hidden">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="logo preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-ui-text-ter text-3xl">＋</span>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={pickLogo} />
          </label>
          <div className="text-sm text-ui-text-sec">
            Add your logo
            <br />
            <span className="text-ui-text-ter">Optional</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ui-text mb-1">Restaurant name *</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Paradise Biryani"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ui-text mb-1">City</label>
          <input
            className="input"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Kochi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ui-text mb-1">Display phone</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-ui-border bg-white">
              <IndiaFlag />
            </span>
            <input
              className="input rounded-l-none flex-1 min-w-0"
              inputMode="numeric"
              maxLength={10}
              value={form.display_phone}
              onChange={(e) =>
                setForm({ ...form, display_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              placeholder="98765 43210"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ui-text mb-1">Location</label>
          <LocationField
            value={{ link: form.maps_link, name: form.location_name }}
            onChange={(v) => setForm({ ...form, maps_link: v.link, location_name: v.name })}
          />
          <p className="text-[11px] text-ui-text-ter mt-1.5">
            Captured from your device GPS — stand at your restaurant. Optional.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ui-text mb-1">Caption language</label>
          <div className="flex gap-2">
            {(['en', 'ml', 'both'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setForm({ ...form, caption_language: l })}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                  form.caption_language === l
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-white text-ui-text-sec border-ui-border'
                }`}
              >
                {l === 'en' ? 'English' : l === 'ml' ? 'Malayalam' : 'Both'}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving…' : 'Finish setup'}
        </button>
      </form>
    </div>
  )
}
