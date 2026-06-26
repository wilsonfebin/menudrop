import { redirect } from 'next/navigation'

// Root simply hands off to middleware-controlled routing.
export default function Index() {
  redirect('/dashboard')
}
