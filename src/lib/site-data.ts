import { createServiceClient } from '@/lib/supabase/server'
import { computeProgress } from '@/lib/progress'
import { reverseGeocode } from '@/lib/route-data'
import type { Challenge, DailyActivity, RoutePoint, Milestone } from '@/lib/types'
import { getMockData } from '@/lib/mock-data'
import type { PostcardData } from '@/components/Postcards'
import { activityStats, checkpointArrivals } from '@/lib/journey'
import postcardsData from '@/lib/postcards-data.json'

// ============================================================
// Everything the public pages (and the iOS app feed) show,
// loaded and derived in one place.
// ============================================================

export async function loadSiteData() {
  let challenge: Challenge | null = null
  let activities: DailyActivity[] = []
  let routePoints: RoutePoint[] = []
  let milestones: Milestone[] = []

  try {
    const supabase = createServiceClient()
    const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'

    const [challengeRes, routeRes, milestonesRes] = await Promise.all([
      supabase
        .from('challenges')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
        .single(),
      supabase
        .from('route_points')
        .select('*')
        .order('order_index'),
      supabase
        .from('milestones')
        .select('*')
        .eq('is_visible', true)
        .order('milestone_date', { ascending: false })
        .limit(20),
    ])

    if (challengeRes.data) {
      challenge = challengeRes.data
      const challengeId = challengeRes.data.id

      const activitiesRes = await supabase
        .from('daily_activity')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('activity_date')

      activities = activitiesRes.data ?? []
    }

    routePoints = routeRes.data ?? []
    // Only the current fastest week counts — older records were superseded
    let seenFastestWeek = false
    milestones = (milestonesRes.data ?? [])
      .filter((m) => {
        if (m.milestone_type !== 'fastest_week') return true
        if (seenFastestWeek) return false
        seenFastestWeek = true
        return true
      })
      .slice(0, 10)
  } catch {
    // DB not connected yet — fall through to mock data
  }

  // Use mock data if no live data yet
  if (!challenge) {
    const mock = getMockData()
    challenge = mock.challenge
    activities = mock.activities
    routePoints = mock.routePoints
    milestones = mock.milestones
  }

  const progress = computeProgress(activities, challenge, routePoints)

  // Find the most recent synced_at across all activity records
  const lastSyncedAt = activities.reduce<string | null>((latest, a) => {
    if (!a.synced_at) return latest
    if (!latest) return a.synced_at
    return a.synced_at > latest ? a.synced_at : latest
  }, null)

  // Reverse geocode the interpolated position for a precise current city name.
  // Falls back to the last-passed checkpoint name if geocoding fails.
  if (progress.current_position && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    const geocoded = await reverseGeocode(
      progress.current_position.lat,
      progress.current_position.lng,
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    )
    if (geocoded) {
      progress.current_location_name = geocoded
    }
  }

  // Attach latest milestone text to progress
  if (milestones.length > 0) {
    progress.latest_milestone_text = milestones[0].title
  }

  // Fetch a city photo from Unsplash
  const locationParts = progress.current_location_name.split(',').map(s => s.trim())
  const cityName = locationParts[0]
  const cityDisplayName = locationParts.slice(0, 2).filter(Boolean).join(', ')
  let cityPhotoUrl: string | null = null
  let cityPhotographerName: string | null = null
  let cityPhotographerUrl: string | null = null

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (unsplashKey) {
    // Build queries from most to least specific, each phrased as a place search
    const queries = [
      `${cityName} city`,
      `${cityName} landscape`,
      ...locationParts.slice(1).map(s => `${s} landscape`),
    ].filter(Boolean)

    for (const query of queries) {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&content_filter=high`,
          {
            headers: { Authorization: `Client-ID ${unsplashKey}` },
            next: { revalidate: 300 },
          }
        )
        if (!res.ok) continue
        const data = await res.json()
        const results: Array<{
          urls: { regular: string }
          user: { name: string; links: { html: string } }
          alt_description: string | null
          description: string | null
        }> = data.results ?? []
        if (results.length === 0) continue

        // Prefer a photo whose description mentions the city name
        const cityLower = cityName.toLowerCase()
        const relevant = results.find(p =>
          (p.alt_description ?? '').toLowerCase().includes(cityLower) ||
          (p.description ?? '').toLowerCase().includes(cityLower)
        )
        const photo = relevant ?? results[0]

        cityPhotoUrl = photo.urls.regular
        cityPhotographerName = photo.user.name
        cityPhotographerUrl = photo.user.links.html
        break
      } catch {
        // Photo is decorative — fail silently
      }
    }
  }

  // Compute miles to next checkpoint
  const maxRouteMile = routePoints.reduce((max, p) => Math.max(max, p.cumulative_mile_marker), 0)
  const cappedMiles = Math.min(progress.total_miles, maxRouteMile)
  const nextCheckpoint = [...routePoints]
    .sort((a, b) => a.cumulative_mile_marker - b.cumulative_mile_marker)
    .find(p => p.cumulative_mile_marker > cappedMiles)
  const milesToNextCheckpoint = nextCheckpoint
    ? nextCheckpoint.cumulative_mile_marker - cappedMiles
    : null

  // Daily activity calendar + streaks
  const todayPT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date())
  const stats = activityStats(activities, progress.target_pace_miles_per_day)

  // Postcards for every city reached so far (backdated from daily history)
  const cardInfo = postcardsData as Record<string, Omit<PostcardData, 'orderIndex' | 'city' | 'state' | 'mile' | 'date'>>
  const postcards: PostcardData[] = checkpointArrivals(activities, routePoints)
    .filter((a) => cardInfo[a.order_index])
    .map((a) => {
      const parts = a.name.split(',').map((x) => x.trim())
      return {
        ...cardInfo[a.order_index],
        orderIndex: a.order_index,
        city: parts[0],
        state: parts[parts.length - 1],
        mile: a.mile,
        date: a.date,
      }
    })
    .reverse()

  return {
    challenge,
    activities,
    routePoints,
    milestones,
    progress,
    lastSyncedAt,
    cityDisplayName,
    cityPhotoUrl,
    cityPhotographerName,
    cityPhotographerUrl,
    nextCheckpoint,
    milesToNextCheckpoint,
    todayPT,
    stats,
    postcards,
  }
}

export type SiteData = Awaited<ReturnType<typeof loadSiteData>>
