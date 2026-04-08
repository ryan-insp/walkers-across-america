'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="text-center mb-10">
          <span className="text-accent text-3xl">◈</span>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-2">Admin Access</p>
          <h1 className="text-text-primary text-xl font-bold mt-1">Ryan&apos;s Walker 2026</h1>
        </div>

        {sent ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-3xl mb-3">✉️</p>
            <p className="text-text-primary font-semibold mb-1">Check your email</p>
            <p className="text-text-secondary text-sm">
              Magic link sent to <span className="text-text-primary">{email}</span>
            </p>
            <p className="text-text-muted text-xs mt-3">Click the link to sign in. No password needed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-dim text-black font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  )
}
