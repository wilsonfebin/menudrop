'use client'
import { useState } from 'react'
import MapPin from './MapPin'

export interface LocationValue {
  link: string
  name: string
}

export default function LocationField({
  value,
  onChange,
}: {
  value: LocationValue
  onChange: (v: LocationValue) => void
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function reverseGeocode(lat: string, lng: string, link: string) {
    try {
      const r = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { cache: 'no-store' })
      const d = await r.json()
      onChange({ link, name: d.name || '' })
      setMsg(d.name ? 'Location captured — check the name is right.' : 'Location captured.')
    } catch {
      onChange({ link, name: '' })
      setMsg('Location captured.')
    } finally {
      setBusy(false)
    }
  }

  function useMyLocation() {
    setMsg(null)
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setMsg('Location isn’t supported on this device.')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        const link = `https://www.google.com/maps?q=${lat},${lng}`
        onChange({ link, name: value.name })
        reverseGeocode(lat, lng, link)
      },
      (err) => {
        setBusy(false)
        setMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Permission denied — left blank. Enable location to use this.'
            : 'Couldn’t get your location — left blank.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-60"
        >
          <MapPin size={16} />
          {busy ? 'Locating…' : value.link ? 'Update location' : 'Use my location'}
        </button>
        {value.link && (
          <button
            type="button"
            onClick={() => {
              onChange({ link: '', name: '' })
              setMsg(null)
            }}
            className="text-ui-text-ter text-sm px-1"
          >
            Clear
          </button>
        )}
      </div>

      {value.link && (
        <div className="mt-2 space-y-1">
          <input
            className="input py-2 text-sm"
            placeholder="Place or landmark — edit if needed"
            value={value.name}
            onChange={(e) => onChange({ link: value.link, name: e.target.value })}
          />
          <a
            href={value.link}
            target="_blank"
            rel="noreferrer"
            className="block text-xs text-brand-blue truncate"
          >
            {value.link}
          </a>
        </div>
      )}

      {msg && <p className="text-[11px] text-ui-text-ter mt-1">{msg}</p>}
    </div>
  )
}
