'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', label: 'Home', icon: '⌂' },
  { href: '/create', label: 'Create', icon: '+' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function NavBar() {
  const path = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-ui-border
                 flex items-center h-20 z-50 max-w-sm mx-auto"
    >
      {tabs.map(({ href, label, icon }) => {
        const active = path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-sm font-medium ${
              active ? 'text-brand-blue' : 'text-ui-text-ter'
            }`}
          >
            <span className="text-2xl leading-none">{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
