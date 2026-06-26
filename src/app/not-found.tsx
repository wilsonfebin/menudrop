import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ui-bg flex flex-col items-center justify-center p-6 text-center">
      <p className="text-4xl mb-4">🍛</p>
      <h2 className="text-xl font-bold text-ui-text mb-2">Page not found</h2>
      <Link href="/dashboard" className="text-brand-blue font-semibold mt-4">
        Back to dashboard
      </Link>
    </div>
  )
}
