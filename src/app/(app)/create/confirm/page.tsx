'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreate } from '@/store/create'
import { useProfile } from '@/store/profile'
import { IMAGE_FORMATS } from '@/types'
import type { BackgroundOption, ImageFormat } from '@/types'
import TopBar from '@/components/layout/TopBar'

type BgKind = 'photo' | 'dish_photo' | 'brand_color'

export default function ConfirmPage() {
  const router = useRouter()
  const {
    dishes,
    updateDish,
    removeDish,
    addDish,
    background,
    setBackground,
    setCaptions,
    photoData,
    format,
    setFormat,
  } = useCreate()
  const { profile, fetch: fetchProfile } = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [bgPhoto, setBgPhoto] = useState<string | null>(photoData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pexelsReady, setPexelsReady] = useState<boolean | null>(null)

  useEffect(() => {
    if (!profile) fetchProfile()
  }, [profile, fetchProfile])

  useEffect(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : { pexels: false }))
      .then((d) => setPexelsReady(!!(d.photo ?? d.pexels)))
      .catch(() => setPexelsReady(false))
  }, [])

  useEffect(() => {
    if (dishes.length === 0) router.replace('/create')
  }, [dishes.length, router])

  const brandColor = profile?.brand_color ?? '#185FA5'
  const effectivePhoto = bgPhoto ?? photoData

  function selectBg(kind: BgKind) {
    if (kind === 'photo') {
      if (effectivePhoto) {
        setBackground({ type: 'photo', image_data: effectivePhoto })
      } else {
        fileRef.current?.click()
      }
    } else if (kind === 'dish_photo') {
      setBackground({ type: 'dish_photo' })
    } else {
      setBackground({ type: 'brand_color', color: brandColor })
    }
  }

  function cycleVeg(i: number, current: 'veg' | 'nonveg' | null | undefined) {
    const order: ('veg' | 'nonveg' | null)[] = [null, 'veg', 'nonveg']
    const next = order[(order.indexOf(current ?? null) + 1) % order.length]
    updateDish(i, { veg: next })
  }

  function pickBgPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      setBgPhoto(data)
      setBackground({ type: 'photo', image_data: data })
    }
    reader.readAsDataURL(file)
  }

  const options: { kind: BgKind; label: string; hint: string }[] = [
    { kind: 'photo', label: '🖼 Your photo', hint: 'Use a photo as the backdrop' },
    { kind: 'dish_photo', label: '🍽 Food image', hint: 'Auto picture by dish name' },
    { kind: 'brand_color', label: '🎨 Brand', hint: 'Your brand colour' },
  ]

  async function generate() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: profile?.name ?? 'Our restaurant',
          dishes,
          platforms: ['instagram', 'whatsapp', 'facebook'],
        }),
      })
      const data = await res.json()
      if (res.status === 402) throw new Error('You have hit the free monthly limit. Upgrade in Settings.')
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setCaptions(data.captions)
      router.push('/create/output')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5">
      <TopBar title="Review" to="/create" />
      <h1 className="text-2xl font-bold text-ui-text mb-1">Check the dishes</h1>
      <p className="text-ui-text-sec mb-4">Fix anything we misread. Tap the square to mark veg / non-veg.</p>

      <div className="space-y-2 mb-5">
        {dishes.map((d, i) => (
          <div key={i} className="card flex items-center gap-1.5 p-3">
            <button
              type="button"
              onClick={() => cycleVeg(i, d.veg)}
              aria-label="Toggle veg / non-veg"
              className="h-9 w-9 shrink-0 rounded-md border-2 flex items-center justify-center"
              style={{
                borderColor:
                  d.veg === 'veg' ? '#1B7A3D' : d.veg === 'nonveg' ? '#B00020' : '#D8D6CF',
              }}
            >
              {d.veg ? (
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: d.veg === 'veg' ? '#1B7A3D' : '#B00020' }}
                />
              ) : (
                <span className="text-ui-text-ter text-xs">–</span>
              )}
            </button>
            <input
              className="input flex-1 py-2 min-w-0"
              value={d.name}
              placeholder="Dish name"
              onChange={(e) => updateDish(i, { name: e.target.value })}
            />
            <div className="flex items-center">
              <span className="text-ui-text-ter mr-1">₹</span>
              <input
                className="input w-20 py-2"
                inputMode="numeric"
                value={d.price ?? ''}
                placeholder="—"
                onChange={(e) =>
                  updateDish(i, { price: e.target.value.replace(/\D/g, '') || null })
                }
              />
            </div>
            <button
              onClick={() => removeDish(i)}
              className="text-ui-text-ter px-2 text-xl"
              aria-label="remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button onClick={addDish} className="btn-secondary w-full mb-6">
        + Add a dish
      </button>

      <h2 className="text-sm font-semibold text-ui-text mb-2">Background</h2>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {options.map((o) => {
          const active = background.type === o.kind
          return (
            <button
              key={o.kind}
              onClick={() => selectBg(o.kind)}
              className={`relative rounded-xl border px-2 py-3 text-xs font-medium text-center ${
                active
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-ui-text-sec border-ui-border'
              }`}
            >
              {o.kind === 'dish_photo' && pexelsReady !== null && (
                <span
                  className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${
                    pexelsReady ? 'bg-green-500' : 'bg-amber-400'
                  }`}
                  aria-hidden
                />
              )}
              {o.label}
            </button>
          )
        })}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickBgPhoto} />

      {background.type === 'photo' && effectivePhoto && (
        <div className="mb-2 flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg overflow-hidden border border-ui-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={effectivePhoto} alt="background" className="h-full w-full object-cover" />
          </div>
          <button onClick={() => fileRef.current?.click()} className="text-brand-blue text-sm font-medium">
            Change photo
          </button>
        </div>
      )}
      {background.type === 'photo' && !effectivePhoto && (
        <p className="text-xs text-ui-text-ter mb-2">Tap “Your photo” to upload a backdrop.</p>
      )}
      {background.type === 'dish_photo' && (
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`h-2 w-2 rounded-full ${
              pexelsReady === null
                ? 'bg-ui-text-ter'
                : pexelsReady
                ? 'bg-green-500'
                : 'bg-amber-400'
            }`}
            aria-hidden
          />
          <span className="text-xs text-ui-text-ter">
            {pexelsReady === null
              ? 'Checking photo service…'
              : pexelsReady
              ? 'Live food photos on — fetches a picture for your first dish.'
              : 'No photo key set — will use a gradient background instead.'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-1.5 mt-5">
        <h2 className="text-sm font-semibold text-ui-text">Size</h2>
        <span className="text-xs text-ui-text-ter">{IMAGE_FORMATS[format].hint}</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        {(Object.keys(IMAGE_FORMATS) as ImageFormat[]).map((f) => {
          const fmt = IMAGE_FORMATS[f]
          const active = format === f
          return (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex-1 rounded-lg border px-1 py-1.5 text-center text-xs font-medium ${
                active
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-ui-text-sec border-ui-border'
              }`}
            >
              {fmt.label}{' '}
              <span className={active ? 'text-white/70' : 'text-ui-text-ter'}>{fmt.ratio}</span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-600 mb-3 mt-3">{error}</p>}
      <button
        onClick={generate}
        disabled={loading || dishes.length === 0}
        className="btn-primary w-full mt-4"
      >
        {loading ? 'Writing captions…' : 'Generate captions →'}
      </button>
    </div>
  )
}
