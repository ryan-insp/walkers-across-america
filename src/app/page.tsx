import { createServiceClient } from '@/lib/supabase/server'
import { computeProgress, formatPace } from '@/lib/progress'
import { reverseGeocode } from '@/lib/route-data'
import { format, parse, parseISO } from 'date-fns'
import type { Challenge, DailyActivity, RoutePoint, Milestone } from '@/lib/types'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import MapSection from '@/components/MapSection'
import StatsGrid from '@/components/StatsGrid'
import MilestonesFeed from '@/components/MilestonesFeed'
import { getMockData } from '@/lib/mock-data'
import { getFunFact } from '@/lib/fun-fact'
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

  // Generate daily fun fact for the current location
  const funFact = await getFunFact(progress.current_location_name)

  // Attach latest milestone text to progress
  if (milestones.length > 0) {
    progress.latest_milestone_text = milestones[0].title
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0B0D0C' }}>
      <Nav />
      <Hero
        milesWalked={progress.total_miles}
        percentComplete={progress.percent_complete}
        currentLocation={progress.current_location_name.split(',')[0]}
      />
      <MapSection routePoints={routePoints} progress={progress} />
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
      />
      <FunFact location={progress.current_location_name} fact={funFact} />
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
            Last synced{' '}
            {format(parseISO(lastSyncedAt), 'MMM d')}
            {' at '}
            {format(parseISO(lastSyncedAt), 'h:mm a')}
          </p>
        )}
      </footer>
    </main>
  )
}
