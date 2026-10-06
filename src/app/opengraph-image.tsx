import { ImageResponse } from 'next/og'
import { createServiceClient } from '@/lib/supabase/server'
import { computeProgress } from '@/lib/progress'
import { reverseGeocode, splitRoute } from '@/lib/route-data'
import { getMockData } from '@/lib/mock-data'
import type { Challenge, DailyActivity, RoutePoint } from '@/lib/types'

// Link preview card for texts and social posts — refreshed with the page
export const revalidate = 300
export const alt = "Ryan's Walk Across America 2026 — live progress"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Route sketch box inside the card
const BOX = { x: 0, y: 0, w: 1060, h: 200 }
const BOUNDS = { minLng: -119, maxLng: -73.5, minLat: 32.8, maxLat: 42.2 }

function project([lng, lat]: [number, number]): [number, number] {
  const kx = BOX.w / (BOUNDS.maxLng - BOUNDS.minLng)
  const ky = BOX.h / (BOUNDS.maxLat - BOUNDS.minLat)
  const k = Math.min(kx, ky / Math.cos((37 * Math.PI) / 180))
  const w = (BOUNDS.maxLng - BOUNDS.minLng) * k
  const ox = BOX.x + (BOX.w - w) / 2
  return [ox + (lng - BOUNDS.minLng) * k, BOX.y + (BOUNDS.maxLat - lat) * k * Math.cos((37 * Math.PI) / 180) + 10]
}

function toPath(coords: [number, number][]): string {
  return coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${project(c).map((n) => n.toFixed(1)).join(' ')}`).join(' ')
}

export default async function Image() {
  let challenge: Challenge | null = null
  let activities: DailyActivity[] = []
  let routePoints: RoutePoint[] = []

  try {
    const supabase = createServiceClient()
    const slug = process.env.CHALLENGE_SLUG ?? 'walker-2026'
    const [challengeRes, routeRes] = await Promise.all([
      supabase.from('challenges').select('*').eq('slug', slug).eq('is_public', true).single(),
      supabase.from('route_points').select('*').order('order_index'),
    ])
    if (challengeRes.data) {
      challenge = challengeRes.data
      const activitiesRes = await supabase
        .from('daily_activity')
        .select('*')
        .eq('challenge_id', challengeRes.data.id)
        .order('activity_date')
      activities = activitiesRes.data ?? []
    }
    routePoints = routeRes.data ?? []
  } catch {
    // fall through to mock data
  }

  if (!challenge) {
    const mock = getMockData()
    challenge = mock.challenge
    activities = mock.activities
    routePoints = mock.routePoints
  }

  const progress = computeProgress(activities, challenge, routePoints)
  let location = progress.current_location_name
  if (progress.current_position && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    location = (await reverseGeocode(progress.current_position.lat, progress.current_position.lng, process.env.NEXT_PUBLIC_MAPBOX_TOKEN)) ?? location
  }

  const { walked, remaining, position } = routePoints.length > 1
    ? splitRoute(progress.total_miles, routePoints)
    : { walked: [], remaining: [], position: { lat: 33.9752, lng: -118.425 } }
  const [px, py] = project([position.lng, position.lat])
  const pct = Math.min(100, progress.percent_complete)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0B0D0C',
          color: '#F5F7F6',
          padding: '48px 70px 40px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: '#6B726F', textTransform: 'uppercase', lineHeight: 1.4, marginBottom: 8 }}>
          Playa Vista, CA → Manhattan, NY
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 44, fontWeight: 700 }}>Ryan&apos;s Walk Across America</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 6 }}>
              <span style={{ fontSize: 108, fontWeight: 800, color: '#2EFF8B', letterSpacing: -4, lineHeight: 1 }}>
                {Math.round(progress.total_miles).toLocaleString('en-US')}
              </span>
              <span style={{ fontSize: 34, color: '#A0A7A4', marginLeft: 14 }}>
                of {challenge.target_miles.toLocaleString('en-US')} miles
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 8 }}>
            <span style={{ fontSize: 20, letterSpacing: 3, color: '#6B726F', textTransform: 'uppercase' }}>Now in</span>
            <span style={{ fontSize: 40, fontWeight: 700 }}>{location.split(',').slice(0, 2).join(',')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', width: '100%', height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, marginTop: 22 }}>
          <div style={{ display: 'flex', width: `${pct}%`, height: 12, background: '#2EFF8B', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: '#6B726F', marginTop: 8 }}>
          <span>{pct.toFixed(1)}% complete</span>
          <span>ryanswalk.com</span>
        </div>

        <div style={{ display: 'flex', marginTop: 10 }}>
          <svg width={BOX.w} height={BOX.h + 20} viewBox={`0 0 ${BOX.w} ${BOX.h + 20}`}>
            <path d={toPath(remaining)} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={4} strokeDasharray="8 10" strokeLinecap="round" />
            <path d={toPath(walked)} fill="none" stroke="#2EFF8B" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            {routePoints.map((p) => {
              const [cx, cy] = project([p.lng, p.lat])
              return <circle key={p.order_index} cx={cx} cy={cy} r={5} fill={p.cumulative_mile_marker <= progress.total_miles ? '#2EFF8B' : 'rgba(255,255,255,0.35)'} />
            })}
            <circle cx={px} cy={py} r={16} fill="rgba(46,255,139,0.25)" />
            <circle cx={px} cy={py} r={8} fill="#F5F7F6" />
          </svg>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: '#6B726F', marginTop: -6 }}>
          <span>Los Angeles</span>
          <span>New York</span>
        </div>
      </div>
    ),
    size
  )
}
