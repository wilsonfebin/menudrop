'use client'
import { LANGUAGES, SECOND_LANGUAGES } from '@/types'
import type { LangCode } from '@/types'

// Picks the SECOND caption language. English is always generated alongside it.
export default function LanguageSelect({
  value,
  onChange,
  className = '',
}: {
  value: LangCode
  onChange: (l: LangCode) => void
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LangCode)}
        className="input appearance-none bg-white pr-11 cursor-pointer"
        aria-label="Second caption language"
      >
        {SECOND_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            English + {LANGUAGES[code]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ui-text-ter">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  )
}
