'use client'
import { useRouter } from 'next/navigation'

export default function TopBar({
  title,
  to,
}: {
  title?: string
  to?: string
}) {
  const router = useRouter()
  return (
    <header
      className="sticky top-0 z-40 -mx-5 -mt-5 mb-3 flex items-center h-12 px-2
                 bg-ui-bg/85 backdrop-blur border-b border-ui-border"
    >
      <button
        onClick={() => (to ? router.push(to) : router.back())}
        aria-label="Back"
        className="flex items-center justify-center h-9 w-9 text-ui-text active:opacity-60"
      >
        <span className="text-3xl leading-none">‹</span>
      </button>
      {title && (
        <h2 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-ui-text">
          {title}
        </h2>
      )}
    </header>
  )
}
