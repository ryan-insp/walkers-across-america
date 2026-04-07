import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeProgress } from '@/lib/progress'
import { getMockData } from '@/lib/mock-data'

export const revalidate = 300

export async function GET() {
  try {
    const supabase = createServiceClient()
    const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'

    const [challengeRes, routeRes] = await Promise.all([
      supabase.from('challenges').select('*').eq('slug', slug).eq('is_public', true).single(),
      supabase.from('route_points').select('*').order('order_index'),
    ])

    if (!challengeRes.data) {
      // Fall back to mock
      const mock = getMockData()
      const progress = computeProgress(mock.activities, mock.challenge, mock.routePoints)
      return NextResponse.json({ progress, source: 'mock' })
    }

    const challenge = challengeRes.data
    const routePoints = routeRes.data ?? []

    const activitiesRes = await supabase
      .from('daily_activity')
      .select('*')
      .eq('challenge_id', challenge.id)
      .order('activity_date')

    const progress = computeProgress(activitiesRes.data ?? [], challenge, routePoints)

    return NextResponse.json({ progress, source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
