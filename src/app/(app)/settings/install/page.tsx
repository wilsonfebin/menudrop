'use client'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import TopBar from '@/components/layout/TopBar'

export default function InstallPage() {
  const { canInstall, installed, promptInstall } = usePWAInstall()

  return (
    <div className="p-5">
      <TopBar title="Install" to="/settings" />
      <h1 className="text-2xl font-bold text-ui-text mb-2">Install MenuDrop</h1>
      <p className="text-ui-text-sec mb-6">
        Add MenuDrop to your home screen for one-tap access — no app store needed.
      </p>

      {installed ? (
        <div className="card text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-semibold text-ui-text">Already installed</p>
        </div>
      ) : canInstall ? (
        <button onClick={promptInstall} className="btn-primary w-full">
          Add to home screen
        </button>
      ) : (
        <div className="card text-sm text-ui-text-sec space-y-3">
          <p className="font-semibold text-ui-text">Install manually:</p>
          <p>
            <strong>iPhone (Safari):</strong> tap the Share button, then{' '}
            <em>Add to Home Screen</em>.
          </p>
          <p>
            <strong>Android (Chrome):</strong> tap the ⋮ menu, then{' '}
            <em>Install app</em> / <em>Add to Home screen</em>.
          </p>
        </div>
      )}
    </div>
  )
}
