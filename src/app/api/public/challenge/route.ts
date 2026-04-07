import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 300

export async function GET() {
  try {
    const supabase = createServiceClient()
    const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
