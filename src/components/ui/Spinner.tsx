export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="h-8 w-8 rounded-full border-2 border-brand-blue-lt border-t-brand-blue animate-spin" />
      {label && <p className="text-sm text-ui-text-sec">{label}</p>}
    </div>
  )
}
