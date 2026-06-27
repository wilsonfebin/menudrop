'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreate } from '@/store/create'
import { useProfile } from '@/store/profile'
import { requestSpecialsBlob, requestFomoBlob, triggerDownload } from '@/lib/utils/download'
import { IMAGE_FORMATS } from '@/types'
import TopBar from '@/components/layout/TopBar'

type Platform = 'whatsapp' | 'instagram' | 'facebook'
const PLATFORMS: { key: Platform; label: string; bg: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', bg: '#25D366' },
  {
    key: 'instagram',
    label: 'Instagram',
    bg: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
  },
  { key: 'facebook', label: 'Facebook', bg: '#1877F2' },
]

function BrandIcon({ name, size = 18 }: { name: Platform; size?: number }) {
  if (name === 'whatsapp')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    )
  if (name === 'facebook')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
      </svg>
    )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.4" fill="#fff" stroke="none" />
    </svg>
  )
}

export default function OutputPage() {
  const router = useRouter()
  const { mode, dishes, fomo, captions, background, format, updateFomo, setCaptions, reset } =
    useCreate()
  const { profile, fetch: fetchProfile } = useProfile()
  const [lang, setLang] = useState<'en' | 'ml'>('en')
  const [copied, setCopied] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewBlob = useRef<Blob | null>(null)
  const savedRef = useRef(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapsShort, setMapsShort] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) fetchProfile()
  }, [profile, fetchProfile])

  // Shorten the restaurant's maps link once, to append to shared captions.
  useEffect(() => {
    const link = profile?.maps_link
    if (!link) return
    fetch(`/api/shorten?url=${encodeURIComponent(link)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { short: link }))
      .then((d) => setMapsShort(d.short || link))
      .catch(() => setMapsShort(link))
  }, [profile?.maps_link])

  useEffect(() => {
    if (!captions) router.replace('/create')
  }, [captions, router])

  const profilePayload = useCallback(
    () => ({
      name: profile?.name ?? 'Our restaurant',
      logo_url: profile?.logo_url ?? null,
      street: profile?.street ?? null,
      city: profile?.city ?? null,
      display_phone: profile?.display_phone ?? null,
      brand_color: profile?.brand_color ?? null,
      location_name: profile?.location_name ?? null,
      business_hours: profile?.business_hours ?? null,
    }),
    [profile]
  )

  const reqId = useRef(0)
  const generate = useCallback(async () => {
    if (!captions) return
    if (mode !== 'fomo' && dishes.length === 0) return
    const id = ++reqId.current
    setGenerating(true)
    setError(null)
    try {
      const blob =
        mode === 'fomo' && fomo
          ? await requestFomoBlob(fomo, background, profilePayload(), format)
          : await requestSpecialsBlob(dishes, background, profilePayload(), format)
      if (id !== reqId.current) return
      previewBlob.current = blob
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return URL.createObjectURL(blob)
      })
    } catch {
      if (id === reqId.current) setError('Could not render the image')
    } finally {
      if (id === reqId.current) setGenerating(false)
    }
  }, [captions, mode, dishes, fomo, background, format, profilePayload])

  useEffect(() => {
    generate()
  }, [generate])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!captions) return null

  const fileName = () => `${(profile?.name || 'menudrop').replace(/\s+/g, '-')}-specials.png`

  // Append the place name + shortened maps link to captions that get
  // copied/shared.
  const withLocation = (text: string) => {
    const parts = [profile?.location_name?.trim(), mapsShort].filter(Boolean)
    return parts.length ? `${text}\n\n📍 ${parts.join('\n')}` : text
  }

  async function getBlob(): Promise<Blob> {
    if (previewBlob.current) return previewBlob.current
    const blob =
      mode === 'fomo' && fomo
        ? await requestFomoBlob(fomo, background, profilePayload(), format)
        : await requestSpecialsBlob(dishes, background, profilePayload(), format)
    previewBlob.current = blob
    return blob
  }

  // Quick re-post: change the remaining count, re-render the image and refresh
  // captions so the number stays consistent.
  async function changeQty(delta: number) {
    if (!fomo) return
    const next = Math.max(0, (fomo.qty ?? 0) + delta)
    const updated = { ...fomo, qty: next }
    updateFomo({ qty: next }) // re-renders the image via the generate effect
    savedRef.current = false // allow the updated post to be recorded again
    try {
      const res = await fetch('/api/ai/fomo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName: profile?.name ?? 'Our restaurant', content: updated }),
      })
      const data = await res.json()
      if (res.ok) setCaptions(data.captions)
    } catch {
      /* keep existing captions */
    }
  }

  function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(blob)
    })
  }

  // Persist the post once (records it for the dashboard + reuse).
  async function savePost(platforms: string[]) {
    if (savedRef.current) return
    savedRef.current = true
    try {
      const blob = previewBlob.current ?? (await getBlob())
      const image_data = await blobToDataUrl(blob)
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: mode, dishes, fomo, captions, background, format, platforms, image_data }),
      })
    } catch {
      savedRef.current = false
    }
  }

  async function copy(platform: Platform) {
    await navigator.clipboard.writeText(withLocation(captions![platform][lang]))
    setCopied(platform)
    setTimeout(() => setCopied(null), 1500)
  }

  async function shareTo(platform: Platform) {
    setError(null)
    setNote(null)
    const caption = withLocation(captions![platform][lang])
    try {
      // Always put the caption on the clipboard (Instagram/Facebook can't be
      // pre-filled, so the user just pastes it).
      await navigator.clipboard.writeText(caption).catch(() => {})
      const blob = await getBlob()
      const file = new File([blob], fileName(), { type: 'image/png' })

      const canShareFiles =
        typeof navigator !== 'undefined' &&
        !!navigator.canShare &&
        navigator.canShare({ files: [file] })

      if (canShareFiles) {
        await navigator.share({ files: [file], text: caption, title: profile?.name ?? 'MenuDrop' })
        setNote('Shared! The caption is also copied to your clipboard.')
        void savePost([platform])
        return
      }

      // Desktop / unsupported: save the image + open the platform with the caption.
      triggerDownload(blob, fileName())
      const enc = encodeURIComponent(caption)
      if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${enc}`, '_blank')
        setNote('Image saved & caption copied — attach the image in WhatsApp.')
      } else if (platform === 'facebook') {
        const app = typeof window !== 'undefined' ? window.location.origin : ''
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(app)}&quote=${enc}`,
          '_blank'
        )
        setNote('Image saved & caption copied — attach it to your Facebook post.')
      } else {
        setNote('Image saved & caption copied — open Instagram and paste the caption.')
      }
      void savePost([platform])
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setError('Could not share — image saved instead.')
      try {
        triggerDownload(await getBlob(), fileName())
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="p-5">
      <TopBar title="Share" to={mode === 'fomo' ? '/create' : '/create/confirm'} />
      <h1 className="text-2xl font-bold text-ui-text mb-1">Ready to post</h1>
      <p className="text-ui-text-sec mb-4">Choose a language, then share.</p>

      <div className="card mb-4 p-0 overflow-hidden">
        <div
          className="relative bg-ui-bg"
          style={{ aspectRatio: `${IMAGE_FORMATS[format].w} / ${IMAGE_FORMATS[format].h}` }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Generated specials" className="h-full w-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ui-text-ter text-sm">
              {generating ? 'Rendering your image…' : 'Preparing…'}
            </div>
          )}
          {generating && previewUrl && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            </div>
          )}
        </div>
      </div>

      {mode === 'fomo' && fomo?.template === 'limited' && (
        <div className="card p-3 mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-ui-text">Stock left — tap to re-post</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeQty(-1)}
              disabled={generating}
              className="h-8 w-8 rounded-lg border border-ui-border text-lg font-bold text-ui-text active:scale-95 disabled:opacity-50"
            >
              −
            </button>
            <span className="w-8 text-center font-bold text-ui-text">{fomo.qty ?? 0}</span>
            <button
              onClick={() => changeQty(1)}
              disabled={generating}
              className="h-8 w-8 rounded-lg border border-ui-border text-lg font-bold text-ui-text active:scale-95 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        {(['en', 'ml'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              lang === l
                ? 'bg-brand-blue text-white border-brand-blue'
                : 'bg-white text-ui-text-sec border-ui-border'
            }`}
          >
            {l === 'en' ? 'English' : 'Malayalam'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {PLATFORMS.map(({ key, label, bg }) => (
          <button
            key={key}
            onClick={() => shareTo(key)}
            disabled={generating && !previewUrl}
            className="rounded-lg py-2.5 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
            style={{ background: bg }}
          >
            <BrandIcon name={key} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={async () => {
            triggerDownload(await getBlob(), fileName())
            void savePost([])
          }}
          className="text-ui-text-sec text-sm font-medium"
        >
          ⬇ Save image
        </button>
        <button onClick={generate} disabled={generating} className="text-brand-blue text-sm font-medium">
          ↻ New image
        </button>
      </div>

      {note && <p className="text-sm text-brand-teal mb-3">{note}</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <h2 className="text-sm font-semibold text-ui-text mb-2">Captions</h2>
      <div className="space-y-2">
        {PLATFORMS.map(({ key, label, bg }) => (
          <div key={key} className="card p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 font-semibold text-ui-text">
                <span
                  className="h-6 w-6 rounded-md flex items-center justify-center"
                  style={{ background: bg }}
                >
                  <BrandIcon name={key} size={14} />
                </span>
                {label}
              </span>
              <button onClick={() => copy(key)} className="text-brand-blue text-sm font-medium">
                {copied === key ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-ui-text-sec whitespace-pre-wrap">
              {withLocation(captions[key][lang]) || '—'}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          reset()
          router.push('/dashboard')
        }}
        className="btn-secondary w-full mt-6"
      >
        Done
      </button>
    </div>
  )
}
