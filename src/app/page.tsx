import { formatPace, formatAheadBehind } from '@/lib/progress'
import { format, parse, parseISO } from 'date-fns'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import MapSection from '@/components/MapSection'
import CityPhoto from '@/components/CityPhoto'
import StatsGrid from '@/components/StatsGrid'
import MilestonesFeed from '@/components/MilestonesFeed'
import FunFact from '@/components/FunFact'
import ActivityCalendar from '@/components/ActivityCalendar'
import Postcards from '@/components/Postcards'
import { loadSiteData } from '@/lib/site-data'

// Revalidate every 5 minutes
export const revalidate = 300

export default async function HomePage() {
  const {
    challenge,
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
  } = await loadSiteData()

  return (
    <main style={{ minHeight: '100vh', background: '#0B0B0C' }}>
      <Nav />
      <Hero
        milesWalked={progress.total_miles}
        targetMiles={challenge.target_miles}
        percentComplete={progress.percent_complete}
        currentLocation={progress.current_location_name.split(',').slice(0, 2).join(',')}
        nextStop={nextCheckpoint && milesToNextCheckpoint !== null
          ? { city: nextCheckpoint.name.split(',')[0], milesToGo: milesToNextCheckpoint }
          : null}
        aheadBehindText={formatAheadBehind(progress.ahead_behind_miles)}
        isAhead={progress.ahead_behind_miles >= 0}
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
      <ActivityCalendar
        stats={stats}
        year={challenge.year}
        today={todayPT}
        dailyGoalMiles={progress.target_pace_miles_per_day}
      />
      <FunFact location={progress.current_location_name} />
      <Postcards
        postcards={postcards}
        totalCities={routePoints.filter((p) => p.point_type !== 'start').length}
        nextStop={nextCheckpoint && milesToNextCheckpoint !== null
          ? { city: nextCheckpoint.name.split(',')[0], milesToGo: milesToNextCheckpoint }
          : null}
      />
      <MilestonesFeed milestones={milestones} />
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 56,
          paddingBottom: 48,
          textAlign: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.png" alt="" aria-hidden style={{ height: 28, width: 'auto', margin: '0 auto 16px', display: 'block', opacity: 0.9 }} />
        <p style={{ fontSize: 13, color: '#8A867E', margin: 0, letterSpacing: '0.01em' }}>
          Ryan&apos;s Walk &nbsp;·&nbsp; Playa Vista, CA → Manhattan, NY
        </p>
        {lastSyncedAt && (
          <p style={{ fontSize: 11, color: '#55524C', margin: '8px 0 0', letterSpacing: '0.02em' }}>
            {`Last synced ${new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(parseISO(lastSyncedAt))} PT`}
          </p>
        )}
      </footer>
    </main>
  )
}
