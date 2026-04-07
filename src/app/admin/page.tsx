import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const service = createServiceClient()
  const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'

  const [challengeRes, settingsRes, syncsRes, activityRes] = await Promise.all([
    service.from('challenges').select('*').eq('slug', slug).single(),
    service.from('app_settings').select('*').limit(1).single(),
    service
      .from('sync_events')
      .select('*')
      .order('sync_started_at', { ascending: false })
      .limit(5),
    service
      .from('daily_activity')
      .select('activity_date, miles, steps, synced_at')
      .order('activity_date', { ascending: false })
      .limit(1)
      .single(),
  ])

  return (
    <AdminDashboard
      user={user}
      challenge={challengeRes.data}
      settings={settingsRes.data}
      recentSyncs={syncsRes.data ?? []}
      lastActivity={activityRes.data}
    />
  )
}
