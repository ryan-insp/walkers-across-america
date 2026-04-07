import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET — fetch challenge + app_settings for admin panel
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'

  const [challengeRes, settingsRes] = await Promise.all([
    service.from('challenges').select('*').eq('slug', slug).single(),
    service.from('app_settings').select('*').limit(1).single(),
  ])

  return NextResponse.json({
    challenge: challengeRes.data,
    settings: settingsRes.data,
  })
}

// PATCH — update challenge settings
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const service = createServiceClient()
  const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'

  const allowedChallengeFields = [
    'title', 'target_miles', 'target_steps', 'is_public',
  ]
  const allowedSettingsFields = [
    'theme', 'map_style', 'show_exact_values',
  ]

  const challengePatch: Record<string, unknown> = {}
  const settingsPatch: Record<string, unknown> = {}

  for (const [k, v] of Object.entries(body)) {
    if (allowedChallengeFields.includes(k)) challengePatch[k] = v
    if (allowedSettingsFields.includes(k)) settingsPatch[k] = v
  }

  const results: string[] = []

  if (Object.keys(challengePatch).length > 0) {
    const { error } = await service
      .from('challenges')
      .update({ ...challengePatch, updated_at: new Date().toISOString() })
      .eq('slug', slug)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    results.push('challenge updated')
  }

  if (Object.keys(settingsPatch).length > 0) {
    const challengeRes = await service.from('challenges').select('id').eq('slug', slug).single()
    if (challengeRes.data) {
      const { error } = await service
        .from('app_settings')
        .update({ ...settingsPatch, updated_at: new Date().toISOString() })
        .eq('challenge_id', challengeRes.data.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      results.push('settings updated')
    }
  }

  return NextResponse.json({ ok: true, updated: results })
}
