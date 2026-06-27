export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-brand-blue-dk flex items-start justify-center p-6 pt-[12vh]">
      <div className="w-full max-w-sm mx-auto">{children}</div>
    </div>
  )
}
