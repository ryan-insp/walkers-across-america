import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateMilestones } from '@/lib/milestones'
import type { HealthKitSyncPayload } from '@/lib/types'

// iOS companion app calls this endpoint with a pre-shared key
const SYNC_KEY = process.env.HEALTHKIT_SYNC_KEY
const MIN_DATE = '2026-01-01'

export async function POST(req: NextRequest) {
  // ── Auth: verify sync key ─────────────────────────────────
  const incomingKey = req.headers.get('x-sync-key')
  if (!SYNC_KEY || incomingKey !== SYNC_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: HealthKitSyncPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.challenge_slug || !Array.isArray(payload.activities)) {
    return NextResponse.json({ error: 'Missing challenge_slug or activities' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // ── Resolve challenge ──────────────────────────────────────
  const { data: challenge, error: challengeErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('slug', payload.challenge_slug)
    .single()

  if (challengeErr || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  // ── Record sync start ──────────────────────────────────────
  const { data: syncEvent } = await supabase
    .from('sync_events')
    .insert({
      challenge_id: challenge.id,
      sync_started_at: new Date().toISOString(),
      status: 'running',
      records_written: 0,
      source: 'healthkit_ios',
    })
    .select('id')
    .single()

  let recordsWritten = 0
  let errorMessage: string | null = null

  try {
    // ── Upsert daily activities ────────────────────────────────
    const validActivities = payload.activities.filter((a) => {
      if (!a.date || a.date < MIN_DATE) return false
      // Don't accept future dates
      if (a.date > new Date().toISOString().split('T')[0]) return false
      return true
    })

    if (validActivities.length > 0) {
      const rows = validActivities.map((a) => {
        const hasMiles = typeof a.miles === 'number' && a.miles > 0
        const hasSteps = typeof a.steps === 'number' && a.steps > 0
        const source_priority = hasMiles
          ? 'healthkit_miles'
          : hasSteps
          ? 'healthkit_steps_converted'
          : 'healthkit_miles'

        return {
          challenge_id: challenge.id,
          activity_date: a.date,
          miles: hasMiles ? a.miles : (hasSteps ? (a.steps! / 2000) : null),
          steps: hasSteps ? a.steps : null,
          source_priority,
          synced_at: new Date().toISOString(),
        }
      })

      const { error: upsertErr } = await supabase
        .from('daily_activity')
        .upsert(rows, { onConflict: 'challenge_id,activity_date' })

      if (upsertErr) throw new Error(upsertErr.message)
      recordsWritten = rows.length
    }

    // ── Re-generate milestones ─────────────────────────────────
    const [activitiesRes, routeRes] = await Promise.all([
      supabase
        .from('daily_activity')
        .select('*')
        .eq('challenge_id', challenge.id)
        .order('activity_date'),
      supabase
        .from('route_points')
        .select('*')
        .eq('challenge_id', challenge.id)
        .order('order_index'),
    ])

    if (activitiesRes.data && routeRes.data) {
      const generated = generateMilestones(activitiesRes.data, challenge, routeRes.data)

      if (generated.length > 0) {
        await supabase.from('milestones').upsert(
          generated.map((m) => ({ ...m, challenge_id: challenge.id })),
          { onConflict: 'challenge_id,milestone_type,trigger_value' }
        )
      }
    }

    // ── Mark sync complete ─────────────────────────────────────
    if (syncEvent?.id) {
      await supabase
        .from('sync_events')
        .update({
          sync_completed_at: new Date().toISOString(),
          status: 'success',
          records_written: recordsWritten,
        })
        .eq('id', syncEvent.id)
    }

    return NextResponse.json({
      ok: true,
      records_written: recordsWritten,
      challenge_slug: payload.challenge_slug,
    })
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown error'

    if (syncEvent?.id) {
      await supabase
        .from('sync_events')
        .update({
          sync_completed_at: new Date().toISOString(),
          status: 'error',
          records_written: recordsWritten,
          error_message: errorMessage,
        })
        .eq('id', syncEvent.id)
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
