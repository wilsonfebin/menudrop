'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({
  to,
  label = 'Back',
}: {
  to?: string
  label?: string
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => (to ? router.push(to) : router.back())}
      className="flex items-center gap-1 text-ui-text-sec text-sm font-medium mb-3 -ml-1 active:opacity-60"
      aria-label={label}
    >
      <span className="text-2xl leading-none">‹</span>
      {label}
    </button>
  )
}
