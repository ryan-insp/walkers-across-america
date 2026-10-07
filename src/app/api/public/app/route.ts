import { NextResponse } from 'next/server'
import { loadSiteData } from '@/lib/site-data'
import { splitRoute } from '@/lib/route-data'
import { formatAheadBehind } from '@/lib/progress'

// Everything the iOS app's Today / Activity / Postcards tabs show, in one request.
// Computed per request (date-dependent); the CDN caches for 5 minutes.
export const dynamic = 'force-dynamic'
const CACHE = { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' }

type LngLat = [number, number]

/** Keep every nth point so the payload stays small (endpoints always kept) */
function thin(coords: LngLat[], step: number): LngLat[] {
  return coords.filter((_, i) => i % step === 0 || i === coords.length - 1)
}

export async function GET() {
  try {
    const d = await loadSiteData()
    const { progress, challenge, routePoints } = d

    const sorted = [...routePoints].sort((a, b) => a.cumulative_mile_marker - b.cumulative_mile_marker)
    const maxMile = sorted[sorted.length - 1]?.cumulative_mile_marker ?? 0
    const route = sorted.length > 1 ? splitRoute(Math.min(progress.total_miles, maxMile), sorted) : null
    const goalMiles = Math.min(progress.target_pace_miles_per_day * progress.days_elapsed, maxMile)
    const goal = sorted.length > 1 ? splitRoute(goalMiles, sorted).position : null

    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        progress: {
          total_miles: progress.total_miles,
          total_steps: progress.total_steps,
          target_miles: challenge.target_miles,
          target_steps: challenge.target_steps,
          percent_complete: progress.percent_complete,
          ahead_behind_miles: progress.ahead_behind_miles,
          ahead_behind_text: formatAheadBehind(progress.ahead_behind_miles),
          actual_pace_miles_per_day: progress.actual_pace_miles_per_day,
          target_pace_miles_per_day: progress.target_pace_miles_per_day,
          estimated_arrival_date: progress.estimated_arrival_date,
          location: d.cityDisplayName,
          next_stop: d.nextCheckpoint && d.milesToNextCheckpoint !== null
            ? { city: d.nextCheckpoint.name.split(',')[0], miles_to_go: d.milesToNextCheckpoint }
            : null,
          last_synced_at: d.lastSyncedAt,
          city_photo: d.cityPhotoUrl
            ? { url: d.cityPhotoUrl, photographer: d.cityPhotographerName, photographer_url: d.cityPhotographerUrl }
            : null,
        },
        route: route && {
          walked: thin(route.walked, 2),
          remaining: thin(route.remaining, 2),
          position: route.position,
          goal_position: goal,
          goal_miles: goalMiles,
          checkpoints: sorted.map((p) => ({
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            mile: p.cumulative_mile_marker,
            type: p.point_type,
            passed: p.cumulative_mile_marker <= progress.total_miles,
          })),
        },
        activity: {
          year: challenge.year,
          today: d.todayPT,
          daily_goal_miles: progress.target_pace_miles_per_day,
          days: d.stats.days.map((x) => ({ date: x.date, miles: Math.round(x.miles * 100) / 100 })),
          best_day: d.stats.bestDay,
          best_week: d.stats.bestWeek,
          goal_days: d.stats.goalDays,
          longest_goal_streak: d.stats.longestGoalStreak,
          current_goal_streak: d.stats.currentGoalStreak,
        },
        postcards: d.postcards,
        milestones: d.milestones.map((m) => ({
          id: m.id,
          type: m.milestone_type,
          title: m.title,
          body: m.body,
          date: m.milestone_date,
        })),
      },
      { headers: CACHE }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
