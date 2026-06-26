'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-ui-bg flex flex-col items-center justify-center p-6 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <h2 className="text-xl font-bold text-ui-text mb-2">Something went wrong</h2>
      <p className="text-ui-text-sec mb-6">{error.message || 'An unexpected error occurred'}</p>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  )
}
