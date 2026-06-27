'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/store/profile'
import { useCreate } from '@/store/create'
import type { BackgroundOption, ImageFormat, PostHistory } from '@/types'
import Spinner from '@/components/ui/Spinner'

export default function DashboardPage() {
  const router = useRouter()
  const { profile, fetch: fetchProfile, setLogo } = useProfile()
  const { setMode, setDishes, setFomo, setCaptions, setBackground, setFormat } = useCreate()
  const [posts, setPosts] = useState<PostHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [logoBusy, setLogoBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profile) fetchProfile()
    fetch('/api/posts')
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [profile, fetchProfile])

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setLogo(dataUrl) // optimistic, shows immediately
      setLogoBusy(true)
      try {
        const res = await fetch('/api/profile/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: dataUrl }),
        })
        if (res.ok) {
          const d = await res.json()
          if (d.logo_url) setLogo(d.logo_url)
        }
      } catch {
        /* keep optimistic logo for this session */
      } finally {
        setLogoBusy(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function reuse(post: PostHistory) {
    setMode(post.kind === 'fomo' ? 'fomo' : 'special')
    setDishes(post.dishes ?? [])
    setFomo(post.fomo ?? null)
    if (post.captions) setCaptions(post.captions)
    setBackground((post.background as BackgroundOption) ?? { type: 'dish_photo' })
    setFormat((post.format as ImageFormat) ?? 'portrait')
    router.push('/create/output')
  }

  const thisMonth = posts.filter((p) => {
    const d = new Date(p.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-12 w-12 rounded-card bg-brand-blue-lt flex items-center justify-center overflow-hidden group"
          aria-label="Change logo"
        >
          {profile?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logo_url} alt="logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-extrabold text-brand-blue">
              {(profile?.name ?? 'MD')
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase() || 'MD'}
            </span>
          )}
          <span className="absolute inset-0 bg-black/40 opacity-0 group-active:opacity-100 flex items-center justify-center text-white text-[10px] font-medium">
            {logoBusy ? '…' : 'Edit'}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
        <div>
          <p className="text-ui-text-ter text-sm">Welcome back</p>
          <h1 className="text-xl font-bold text-ui-text">{profile?.name ?? 'Your restaurant'}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-3">
          <p className="text-3xl font-bold text-brand-blue">{thisMonth}</p>
          <p className="text-sm text-ui-text-sec">Posts this month</p>
        </div>
        <div className="card p-3">
          <p className="text-3xl font-bold text-brand-teal">{posts.length}</p>
          <p className="text-sm text-ui-text-sec">Posts all time</p>
        </div>
      </div>

      <Link href="/create" className="btn-primary w-full block text-center mb-8">
        + Create today&apos;s post
      </Link>

      <h2 className="text-sm font-semibold text-ui-text mb-3">Recent posts</h2>
      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <div className="card text-center text-ui-text-sec py-8">
          No posts yet. Create your first one!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {posts.map((p) => (
            <button
              key={p.id}
              onClick={() => reuse(p)}
              className="text-left rounded-card overflow-hidden border border-ui-border bg-white active:scale-[0.98] transition"
            >
              <div className="relative aspect-square bg-brand-blue-dk overflow-hidden">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="post" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="h-full w-full flex flex-col justify-end p-3 text-white"
                    style={{
                      background:
                        p.background?.type === 'brand_color'
                          ? p.background.color
                          : 'linear-gradient(135deg,#2C79C9,#0C447C)',
                    }}
                  >
                    <span className="text-xs font-semibold leading-tight line-clamp-2">
                      {p.kind === 'fomo'
                        ? p.fomo?.headline || p.fomo?.badge || 'Update'
                        : (p.dishes ?? []).slice(0, 2).map((d) => d.name).join(', ')}
                    </span>
                  </div>
                )}
                {p.kind === 'fomo' && (
                  <span className="absolute top-1.5 left-1.5 bg-[#E23B3B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {p.fomo?.badge || 'FOMO'}
                  </span>
                )}
                <span className="absolute top-1.5 right-1.5 bg-black/55 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                  Reuse
                </span>
              </div>
              <div className="px-2.5 py-2">
                <p className="text-xs font-medium text-ui-text truncate">
                  {p.kind === 'fomo'
                    ? p.fomo?.headline || 'FOMO update'
                    : `${(p.dishes ?? []).length} dishes`}
                </p>
                <p className="text-[11px] text-ui-text-ter">
                  {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
