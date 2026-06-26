import { credsReady } from '@/lib/utils/env'

// MSG91 WhatsApp/SMS OTP gateway. When Supabase phone auth is configured to
// use MSG91 as its provider this is optional, but a direct integration is
// provided here for environments that send OTP out-of-band.
const MSG91_SEND_URL = 'https://control.msg91.com/api/v5/otp'
const MSG91_VERIFY_URL = 'https://control.msg91.com/api/v5/otp/verify'

export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  // Default to India (+91) when no country code supplied.
  if (digits.length === 10) return `91${digits}`
  return digits
}

export async function sendOtpViaMsg91(phone: string): Promise<void> {
  if (!credsReady.msg91()) {
    throw new Error('MSG91 not configured')
  }
  const res = await fetch(
    `${MSG91_SEND_URL}?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=${phone}`,
    {
      method: 'POST',
      headers: {
        authkey: process.env.MSG91_AUTH_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sender: process.env.MSG91_SENDER_ID }),
    }
  )
  if (!res.ok) throw new Error(`MSG91 send failed: ${res.status}`)
}

export async function verifyOtpViaMsg91(
  phone: string,
  code: string
): Promise<boolean> {
  if (!credsReady.msg91()) throw new Error('MSG91 not configured')
  const res = await fetch(`${MSG91_VERIFY_URL}?mobile=${phone}&otp=${code}`, {
    method: 'GET',
    headers: { authkey: process.env.MSG91_AUTH_KEY! },
  })
  const json = (await res.json()) as { type?: string }
  return json.type === 'success'
}
