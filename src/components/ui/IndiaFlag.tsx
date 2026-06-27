export default function IndiaFlag({ className = '' }: { className?: string }) {
  return (
    <svg
      width="24"
      height="16"
      viewBox="0 0 24 16"
      className={className}
      role="img"
      aria-label="India (+91)"
    >
      <defs>
        <clipPath id="india-flag-clip">
          <rect width="24" height="16" rx="2.5" />
        </clipPath>
      </defs>
      <g clipPath="url(#india-flag-clip)">
        <rect width="24" height="16" fill="#FFFFFF" />
        <rect width="24" height="5.33" fill="#FF9933" />
        <rect y="10.67" width="24" height="5.33" fill="#138808" />
        <circle cx="12" cy="8" r="1.9" fill="none" stroke="#0A3D91" strokeWidth="0.6" />
      </g>
    </svg>
  )
}
