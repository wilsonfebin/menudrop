import NavBar from '@/components/layout/NavBar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-ui-bg">
      <main className="max-w-sm mx-auto pb-24">{children}</main>
      <NavBar />
    </div>
  )
}
