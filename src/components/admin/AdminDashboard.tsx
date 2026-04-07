'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Challenge, AppSettings, SyncEvent } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

interface AdminDashboardProps {
  user: User
  challenge: Challenge | null
  settings: AppSettings | null
  recentSyncs: SyncEvent[]
  lastActivity: { activity_date: string; miles: number | null; steps: number | null; synced_at: string } | null
}

export default function AdminDashboard({ user, challenge, settings, recentSyncs, lastActivity }: AdminDashboardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [title, setTitle] = useState(challenge?.title ?? '')
  const [targetMiles, setTargetMiles] = useState(String(challenge?.target_miles ?? 2900))
  const [targetSteps, setTargetSteps] = useState(String(challenge?.target_steps ?? 5800000))
  const [isPublic, setIsPublic] = useState(challenge?.is_public ?? true)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        target_miles: parseFloat(targetMiles),
        target_steps: parseInt(targetSteps),
        is_public: isPublic,
      }),
    })

    setSaving(false)
    if (res.ok) {
      setSaveMsg('Saved.')
      router.refresh()
    } else {
      const err = await res.json()
      setSaveMsg(`Error: ${err.error}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-accent">◈</span>
            <span className="text-sm font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">
              ← Public site
            </Link>
            <button
              onClick={handleSignOut}
              className="text-text-muted hover:text-text-secondary transition-colors text-xs"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">{user.email}</p>
        </div>

        {/* Sync status */}
        <section>
          <h2 className="text-text-muted text-xs uppercase tracking-widest font-medium mb-4">Sync Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <SyncCard
              label="Last sync"
              value={recentSyncs[0]
                ? format(parseISO(recentSyncs[0].sync_started_at), 'MMM d, h:mm a')
                : 'Never'}
              status={recentSyncs[0]?.status}
            />
            <SyncCard
              label="Last activity date"
              value={lastActivity ? format(parseISO(lastActivity.activity_date), 'MMM d, yyyy') : '—'}
            />
            <SyncCard
              label="Latest data"
              value={lastActivity
                ? `${lastActivity.miles?.toFixed(1) ?? '—'} mi · ${lastActivity.steps?.toLocaleString() ?? '—'} steps`
                : '—'}
            />
          </div>

          {/* Recent syncs list */}
          {recentSyncs.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-text-muted text-xs uppercase tracking-wider">Recent syncs</p>
              </div>
              {recentSyncs.map((s) => (
                <div key={s.id} className="px-4 py-3 border-b border-border last:border-b-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={s.status} />
                    <div>
                      <p className="text-text-primary text-sm">{format(parseISO(s.sync_started_at), 'MMM d, h:mm a')}</p>
                      {s.error_message && (
                        <p className="text-red-400 text-xs">{s.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-text-secondary text-xs">{s.records_written} records</p>
                    <p className="text-text-muted text-xs capitalize">{s.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Challenge settings */}
        <section>
          <h2 className="text-text-muted text-xs uppercase tracking-widest font-medium mb-4">Challenge Settings</h2>
          <form onSubmit={handleSave} className="bg-surface border border-border rounded-xl p-6 space-y-5">
            <Field label="Challenge Title">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Target Miles">
                <input
                  type="number"
                  value={targetMiles}
                  onChange={(e) => setTargetMiles(e.target.value)}
                  min={1}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
                />
              </Field>
              <Field label="Target Steps">
                <input
                  type="number"
                  value={targetSteps}
                  onChange={(e) => setTargetSteps(e.target.value)}
                  min={1}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
                />
              </Field>
            </div>

            <Field label="Public Visibility">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${isPublic ? 'bg-accent' : 'bg-surface-2'} border border-border`}
                    onClick={() => setIsPublic(!isPublic)}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white mt-0.5 ml-0.5 transition-transform ${isPublic ? 'translate-x-4' : ''}`} />
                  </div>
                </div>
                <span className="text-text-secondary text-sm">{isPublic ? 'Public — anyone can view' : 'Private — hidden'}</span>
              </label>
            </Field>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-accent hover:bg-accent-dim text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saveMsg && (
                <p className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {saveMsg}
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Phase 2 placeholder */}
        <section className="bg-surface border border-border rounded-xl p-6 opacity-50">
          <h2 className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">SMS Notifications</h2>
          <p className="text-text-secondary text-sm">Twilio SMS support coming in Phase 2.</p>
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}

function SyncCard({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-text-muted text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-text-primary text-sm font-semibold">{value}</p>
      {status && <StatusDot status={status} className="mt-1" />}
    </div>
  )
}

function StatusDot({ status, className = '' }: { status: string; className?: string }) {
  const color = status === 'success' ? 'bg-green-400' : status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-text-secondary text-xs capitalize">{status}</span>
    </span>
  )
}
