import { createServiceClient } from '@/lib/supabase/server'
import { computeProgress, formatPace } from '@/lib/progress'
import { reverseGeocode } from '@/lib/route-data'
import { format, parse, parseISO } from 'date-fns'
import type { Challenge, DailyActivity, RoutePoint, Milestone } from '@/lib/types'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import MapSection from '@/components/MapSection'
import CityPhoto from '@/components/CityPhoto'
import StatsGrid from '@/components/StatsGrid'
import MilestonesFeed from '@/components/MilestonesFeed'
import { getMockData } from '@/lib/mock-data'
import FunFact from '@/components/FunFact'

// Revalidate every 5 minutes
export const revalidate = 300

export default async function HomePage() {
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
        .limit(10),
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
    milestones = milestonesRes.data ?? []
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

  return (
    <main style={{ minHeight: '100vh', background: '#0B0D0C' }}>
      <Nav />
      <Hero
        milesWalked={progress.total_miles}
        percentComplete={progress.percent_complete}
        currentLocation={progress.current_location_name.split(',')[0]}
      />
      <MapSection routePoints={routePoints} progress={progress} />
      <CityPhoto
        cityName={cityDisplayName}
        photoUrl={cityPhotoUrl}
        photographerName={cityPhotographerName}
        photographerUrl={cityPhotographerUrl}
      />
      <StatsGrid
        totalMiles={progress.total_miles}
        totalSteps={progress.total_steps}
        percentComplete={progress.percent_complete}
        paceDeltaText={
          Math.abs(progress.ahead_behind_miles) < 0.1
            ? 'On pace'
            : progress.ahead_behind_miles > 0
            ? `+${progress.ahead_behind_miles.toFixed(1)} mi ahead`
            : `${Math.abs(progress.ahead_behind_miles).toFixed(1)} mi behind`
        }
        isAhead={progress.ahead_behind_miles >= 0}
        targetPace={formatPace(progress.target_pace_miles_per_day)}
        actualPace={formatPace(progress.actual_pace_miles_per_day)}
        etaShort={
          progress.estimated_arrival_date && progress.estimated_arrival_date !== 'Complete'
            ? format(parse(progress.estimated_arrival_date, 'MMMM d, yyyy', new Date()), 'MMM d')
            : progress.estimated_arrival_date
        }
        targetDate={format(parse(challenge.end_date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
        currentPositionTitle={progress.current_location_name.split(',')[0]}
        currentPositionSubtitle={progress.current_location_name.split(',').slice(1).join(',').trim()}
        nextCheckpointName={nextCheckpoint ? nextCheckpoint.name.split(',')[0] : null}
        milesToNextCheckpoint={milesToNextCheckpoint}
      />
      <FunFact location={progress.current_location_name} />
      <MilestonesFeed milestones={milestones} />
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 56,
          paddingBottom: 48,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: '#6B726F', margin: 0, letterSpacing: '0.01em' }}>
          Ryan&apos;s Walk Across America 2026 &nbsp;·&nbsp; Playa Vista, CA → Manhattan, NY
        </p>
        {lastSyncedAt && (
          <p style={{ fontSize: 11, color: '#3D4440', margin: '8px 0 0', letterSpacing: '0.02em' }}>
            {`Last synced ${new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(parseISO(lastSyncedAt))} PT`}
          </p>
        )}
      </footer>
    </main>
  )
}
