export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-brand-blue-dk flex items-center justify-center p-6">
      <div className="w-full max-w-sm mx-auto">{children}</div>
    </div>
  )
}
