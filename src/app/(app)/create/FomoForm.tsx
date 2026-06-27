'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreate } from '@/store/create'
import { useProfile } from '@/store/profile'
import { FOMO_BADGES, FOMO_LABELS, IMAGE_FORMATS } from '@/types'
import type { BackgroundOption, FomoContent, FomoTemplate, ImageFormat } from '@/types'

type BgKind = 'photo' | 'dish_photo' | 'brand_color'
const TEMPLATES: FomoTemplate[] = ['happy_hour', 'flash_sale', 'limited', 'holiday', 'custom']

export default function FomoForm() {
  const router = useRouter()
  const { setMode, setFomo, setCaptions, background, setBackground, format, setFormat, photoData } =
    useCreate()
  const { profile, fetch: fetchProfile } = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)

  const [template, setTemplate] = useState<FomoTemplate>('flash_sale')
  const [headline, setHeadline] = useState('')
  const [detail, setDetail] = useState('')
  const [timing, setTiming] = useState('')
  const [item, setItem] = useState('')
  const [qty, setQty] = useState('')
  const [bgPhoto, setBgPhoto] = useState<string | null>(photoData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLimited = template === 'limited'
  const brandColor = profile?.brand_color ?? '#185FA5'
  const effectivePhoto = bgPhoto ?? photoData

  function selectBg(kind: BgKind) {
    if (kind === 'photo') {
      if (effectivePhoto) setBackground({ type: 'photo', image_data: effectivePhoto })
      else fileRef.current?.click()
    } else if (kind === 'dish_photo') setBackground({ type: 'dish_photo' })
    else setBackground({ type: 'brand_color', color: brandColor })
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

  async function createUpdate() {
    setError(null)
    if (isLimited && !item.trim()) return setError('What item is running low?')
    if (!isLimited && !headline.trim()) return setError('Add a headline / message')
    if (!profile) fetchProfile()

    const content: FomoContent = {
      template,
      badge: FOMO_BADGES[template],
      headline: (headline || item).trim(),
      detail: detail.trim(),
      timing: timing.trim(),
      item: isLimited ? item.trim() : '',
      qty: isLimited && qty ? parseInt(qty, 10) : null,
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/fomo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: profile?.name ?? 'Our restaurant', content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not create update')
      setMode('fomo')
      setFomo(content)
      setCaptions(data.captions)
      router.push('/create/output')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const bgOptions: { kind: BgKind; label: string }[] = [
    { kind: 'photo', label: 'Your photo' },
    { kind: 'dish_photo', label: 'Food image' },
    { kind: 'brand_color', label: 'Brand' },
  ]

  return (
    <div>
      <h2 className="text-sm font-semibold text-ui-text mb-2">Type of update</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            onClick={() => setTemplate(t)}
            className={`rounded-pill border px-3 py-1.5 text-xs font-medium ${
              template === t
                ? 'bg-brand-blue text-white border-brand-blue'
                : 'bg-white text-ui-text-sec border-ui-border'
            }`}
          >
            {FOMO_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-5">
        {isLimited && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-ui-text-sec mb-1">Item running low</label>
              <input
                className="input"
                placeholder="Triple Chocolate Fudge cake"
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-ui-text-sec mb-1">Qty left</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="4"
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-ui-text-sec mb-1">
            {isLimited ? 'Headline (optional)' : 'Headline / message'}
          </label>
          <input
            className="input"
            placeholder={
              template === 'happy_hour'
                ? 'Acoustic Thursdays'
                : template === 'holiday'
                ? 'Yes, we’re open this holiday!'
                : 'Free dessert with any main'
            }
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ui-text-sec mb-1">Offer / details</label>
          <input
            className="input"
            placeholder="Half-off signature cocktails"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ui-text-sec mb-1">When</label>
          <input
            className="input"
            placeholder="Today, 6 PM onwards"
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
          />
        </div>
      </div>

      <h2 className="text-sm font-semibold text-ui-text mb-2">Background</h2>
      <div className="grid grid-cols-3 gap-1.5 mb-1">
        {bgOptions.map((o) => {
          const active = background.type === o.kind
          return (
            <button
              key={o.kind}
              onClick={() => selectBg(o.kind)}
              className={`min-w-0 rounded-lg border px-1 py-2 text-xs font-medium text-center truncate ${
                active
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-ui-text-sec border-ui-border'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickBgPhoto} />

      <div className="flex items-center justify-between mb-1.5 mt-5">
        <h2 className="text-sm font-semibold text-ui-text">Size</h2>
        <span className="text-xs text-ui-text-ter">{IMAGE_FORMATS[format].hint}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {(Object.keys(IMAGE_FORMATS) as ImageFormat[]).map((f) => {
          const fmt = IMAGE_FORMATS[f]
          const active = format === f
          return (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`min-w-0 rounded-lg border px-1 py-2 text-center text-xs font-medium truncate ${
                active
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-ui-text-sec border-ui-border'
              }`}
            >
              {fmt.label} <span className={active ? 'text-white/70' : 'text-ui-text-ter'}>{fmt.ratio}</span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-600 mb-3 mt-2">{error}</p>}
      <button onClick={createUpdate} disabled={loading} className="btn-primary w-full mt-3">
        {loading ? 'Writing captions…' : 'Create update →'}
      </button>
    </div>
  )
}
