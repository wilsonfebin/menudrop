'use client'
import { useEffect, useState } from 'react'

// Loads the Razorpay checkout script once.
export function useRazorpayScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      setReady(true)
      return
    }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => setReady(true)
    document.body.appendChild(s)
  }, [])
  return ready
}
