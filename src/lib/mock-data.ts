// ============================================================
// Mock data — used before the database is connected.
// Simulates ~95 days of walking at ~7 mi/day from Jan 1, 2026.
// ============================================================

import type { Challenge, DailyActivity, RoutePoint, Milestone } from './types'
import { ROUTE_CHECKPOINTS } from './route-data'

const CHALLENGE_ID = 'mock-challenge-id'

export function getMockData(): {
  challenge: Challenge
  activities: DailyActivity[]
  routePoints: RoutePoint[]
  milestones: Milestone[]
} {
  const challenge: Challenge = {
    id: CHALLENGE_ID,
    slug: 'walker-2026',
    title: "Ryan's Walk Across America 2026",
    year: 2026,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    start_location_name: 'Playa Vista, Los Angeles, CA',
    end_location_name: 'Manhattan, New York, NY',
    start_lat: 33.9752,
    start_lng: -118.425,
    end_lat: 40.7831,
    end_lng: -73.9712,
    target_miles: 2900,
    target_steps: 5800000,
    is_public: true,
    created_at: '2025-12-01T00:00:00Z',
    updated_at: '2025-12-01T00:00:00Z',
  }

  // Generate 95 days of activity starting Jan 1, 2026
  const activities: DailyActivity[] = []
  const startDate = new Date('2026-01-01')

  for (let i = 0; i < 95; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]

    // Vary pace: base 7mi/day with some noise
    const variance = (Math.sin(i * 1.3) * 2.5) + (Math.cos(i * 0.7) * 1.5)
    const miles = Math.max(0.5, 7 + variance)
    const steps = Math.round(miles * 2000 * (0.95 + Math.random() * 0.1))

    activities.push({
      id: `mock-activity-${i}`,
      challenge_id: CHALLENGE_ID,
      activity_date: dateStr,
      miles: parseFloat(miles.toFixed(2)),
      steps,
      source_priority: 'healthkit_miles',
      synced_at: new Date().toISOString(),
    })
  }

  const routePoints: RoutePoint[] = ROUTE_CHECKPOINTS.map((cp, idx) => ({
    id: `mock-route-${idx}`,
    challenge_id: CHALLENGE_ID,
    order_index: cp.order_index,
    name: cp.name,
    lat: cp.lat,
    lng: cp.lng,
    cumulative_mile_marker: cp.cumulative_mile_marker,
    point_type: cp.point_type,
    created_at: '2025-12-01T00:00:00Z',
  }))

  const milestones: Milestone[] = [
    {
      id: 'mock-ms-1',
      challenge_id: CHALLENGE_ID,
      milestone_type: 'checkpoint',
      title: 'Pasadena is behind you.',
      body: 'Symbolic crossing at Pasadena — mile 15 on the route.',
      milestone_date: '2026-01-03',
      trigger_value: 15,
      is_auto_generated: true,
      is_visible: true,
      created_at: '2026-01-03T00:00:00Z',
    },
    {
      id: 'mock-ms-2',
      challenge_id: CHALLENGE_ID,
      milestone_type: 'miles_100',
      title: '100 miles down.',
      body: 'First hundred in the books.',
      milestone_date: '2026-01-15',
      trigger_value: 100,
      is_auto_generated: true,
      is_visible: true,
      created_at: '2026-01-15T00:00:00Z',
    },
    {
      id: 'mock-ms-3',
      challenge_id: CHALLENGE_ID,
      milestone_type: 'checkpoint',
      title: 'Palm Springs is behind you.',
      body: 'Symbolic crossing at Palm Springs — mile 110 on the route.',
      milestone_date: '2026-01-17',
      trigger_value: 110,
      is_auto_generated: true,
      is_visible: true,
      created_at: '2026-01-17T00:00:00Z',
    },
    {
      id: 'mock-ms-4',
      challenge_id: CHALLENGE_ID,
      milestone_type: 'percent_10',
      title: '10% complete.',
      body: 'Ten percent. The rest of the country is ahead.',
      milestone_date: '2026-01-28',
      trigger_value: 10,
      is_auto_generated: true,
      is_visible: true,
      created_at: '2026-01-28T00:00:00Z',
    },
    {
      id: 'mock-ms-5',
      challenge_id: CHALLENGE_ID,
      milestone_type: 'miles_100',
      title: '200 miles down.',
      body: 'Two hundred miles. Still moving.',
      milestone_date: '2026-01-30',
      trigger_value: 200,
      is_auto_generated: true,
      is_visible: true,
      created_at: '2026-01-30T00:00:00Z',
    },
  ]

  return { challenge, activities, routePoints, milestones }
}
