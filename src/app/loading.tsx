import Spinner from '@/components/ui/Spinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner label="Loading…" />
    </div>
  )
}
