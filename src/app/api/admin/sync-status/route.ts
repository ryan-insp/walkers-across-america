import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'

  const challengeRes = await service
    .from('challenges')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!challengeRes.data) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const [latestSyncRes, activityCountRes, lastActivityRes] = await Promise.all([
    service
      .from('sync_events')
      .select('*')
      .eq('challenge_id', challengeRes.data.id)
      .order('sync_started_at', { ascending: false })
      .limit(5),
    service
      .from('daily_activity')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', challengeRes.data.id),
    service
      .from('daily_activity')
      .select('activity_date, miles, steps, synced_at')
      .eq('challenge_id', challengeRes.data.id)
      .order('activity_date', { ascending: false })
      .limit(1)
      .single(),
  ])

  return NextResponse.json({
    recent_syncs: latestSyncRes.data ?? [],
    total_records: activityCountRes.count ?? 0,
    last_activity: lastActivityRes.data,
  })
}
