'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreate } from '@/store/create'
import TopBar from '@/components/layout/TopBar'

export default function CreatePage() {
  const router = useRouter()
  const {
    inputType,
    rawText,
    photoData,
    setInputType,
    setRawText,
    setPhoto,
    setDishes,
  } = useCreate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function extract() {
    setError(null)
    setLoading(true)
    try {
      const payload =
        inputType === 'photo' ? { image_data: photoData } : { text: rawText }
      if (inputType === 'photo' && !photoData) throw new Error('Add a photo first')
      if (inputType === 'text' && !rawText.trim()) throw new Error('Type your specials first')

      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Extraction failed')
      setDishes(data.dishes)
      router.push('/create/confirm')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5">
      <TopBar title="Create" to="/dashboard" />
      <h1 className="text-2xl font-bold text-ui-text mb-1">Today&apos;s specials</h1>
      <p className="text-ui-text-sec mb-5">Snap the board or type it out.</p>

      <div className="flex gap-2 mb-5">
        {(['photo', 'text'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setInputType(t)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize ${
              inputType === t
                ? 'bg-brand-blue text-white border-brand-blue'
                : 'bg-white text-ui-text-sec border-ui-border'
            }`}
          >
            {t === 'photo' ? '📷 Photo' : '⌨️ Type it'}
          </button>
        ))}
      </div>

      {inputType === 'photo' ? (
        <label className="block cursor-pointer mb-5">
          <div className="rounded-card border border-dashed border-ui-border bg-white aspect-[4/3] flex items-center justify-center overflow-hidden">
            {photoData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoData} alt="board" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-ui-text-ter">
                <div className="text-4xl mb-2">📷</div>
                Tap to add a photo
              </div>
            )}
          </div>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={pickPhoto} />
        </label>
      ) : (
        <textarea
          className="input min-h-[160px] mb-5"
          placeholder={'fish curry 120\nparotta 30\nchicken biryani 180'}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button onClick={extract} disabled={loading} className="btn-primary w-full">
        {loading ? 'Reading…' : 'Extract dishes →'}
      </button>
    </div>
  )
}
