import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getMockData } from '@/lib/mock-data'

export const revalidate = 300

export async function GET() {
  try {
    const supabase = createServiceClient()
    const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'

    const challengeRes = await supabase
      .from('challenges')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!challengeRes.data) {
      const mock = getMockData()
      return NextResponse.json({ milestones: mock.milestones, source: 'mock' })
    }

    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('challenge_id', challengeRes.data.id)
      .eq('is_visible', true)
      .order('milestone_date', { ascending: false })
      .limit(20)

    return NextResponse.json({ milestones: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
