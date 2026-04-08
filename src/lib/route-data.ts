// ============================================================
// Canonical route checkpoint data
// Used for seeding and as the source of truth for the map.
// Cumulative miles are symbolic storytelling distances —
// not exact GPS distances.
// ============================================================

export interface CheckpointSeed {
  order_index: number
  name: string
  lat: number
  lng: number
  cumulative_mile_marker: number
  point_type: 'start' | 'checkpoint' | 'finish'
}

export const ROUTE_CHECKPOINTS: CheckpointSeed[] = [
  {
    order_index: 0,
    name: 'Playa Vista, Los Angeles, CA',
    lat: 33.9752,
    lng: -118.425,
    cumulative_mile_marker: 0,
    point_type: 'start',
  },
  {
    order_index: 1,
    name: 'Pasadena, CA',
    lat: 34.1478,
    lng: -118.1445,
    cumulative_mile_marker: 15,
    point_type: 'checkpoint',
  },
  {
    order_index: 2,
    name: 'Palm Springs, CA',
    lat: 33.8303,
    lng: -116.5453,
    cumulative_mile_marker: 110,
    point_type: 'checkpoint',
  },
  {
    order_index: 3,
    name: 'Phoenix, AZ',
    lat: 33.4484,
    lng: -112.074,
    cumulative_mile_marker: 300,
    point_type: 'checkpoint',
  },
  {
    order_index: 4,
    name: 'Albuquerque, NM',
    lat: 35.0844,
    lng: -106.6504,
    cumulative_mile_marker: 500,
    point_type: 'checkpoint',
  },
  {
    order_index: 5,
    name: 'Santa Fe, NM',
    lat: 35.687,
    lng: -105.9378,
    cumulative_mile_marker: 580,
    point_type: 'checkpoint',
  },
  {
    order_index: 6,
    name: 'Amarillo, TX',
    lat: 35.2220,
    lng: -101.8313,
    cumulative_mile_marker: 750,
    point_type: 'checkpoint',
  },
  {
    order_index: 7,
    name: 'Oklahoma City, OK',
    lat: 35.4676,
    lng: -97.5164,
    cumulative_mile_marker: 950,
    point_type: 'checkpoint',
  },
  {
    order_index: 8,
    name: 'Kansas City, MO',
    lat: 39.0997,
    lng: -94.5786,
    cumulative_mile_marker: 1150,
    point_type: 'checkpoint',
  },
  {
    order_index: 9,
    name: 'St. Louis, MO',
    lat: 38.627,
    lng: -90.1994,
    cumulative_mile_marker: 1300,
    point_type: 'checkpoint',
  },
  {
    order_index: 10,
    name: 'Chicago, IL',
    lat: 41.8781,
    lng: -87.6298,
    cumulative_mile_marker: 1500,
    point_type: 'checkpoint',
  },
  {
    order_index: 11,
    name: 'Cleveland, OH',
    lat: 41.4993,
    lng: -81.6944,
    cumulative_mile_marker: 1700,
    point_type: 'checkpoint',
  },
  {
    order_index: 12,
    name: 'Pittsburgh, PA',
    lat: 40.4406,
    lng: -79.9959,
    cumulative_mile_marker: 1900,
    point_type: 'checkpoint',
  },
  {
    order_index: 13,
    name: 'Philadelphia, PA',
    lat: 39.9526,
    lng: -75.1652,
    cumulative_mile_marker: 2100,
    point_type: 'checkpoint',
  },
  {
    order_index: 14,
    name: 'Manhattan, New York, NY',
    lat: 40.7831,
    lng: -73.9712,
    cumulative_mile_marker: 2900,
    point_type: 'finish',
  },
]

/** Returns the total route distance (last checkpoint cumulative_mile_marker) */
export const TOTAL_ROUTE_MILES = ROUTE_CHECKPOINTS[ROUTE_CHECKPOINTS.length - 1].cumulative_mile_marker

/**
 * Interpolate a geographic position along the route given a distance traveled.
 * Returns { lat, lng } clamped to the route bounds.
 */
export function interpolatePosition(
  milesWalked: number,
  checkpoints: Array<{ lat: number; lng: number; cumulative_mile_marker: number }>
): { lat: number; lng: number } {
  const sorted = [...checkpoints].sort((a, b) => a.cumulative_mile_marker - b.cumulative_mile_marker)
  const clamped = Math.max(0, Math.min(milesWalked, sorted[sorted.length - 1].cumulative_mile_marker))

  // Find the segment containing this mile
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (clamped >= a.cumulative_mile_marker && clamped <= b.cumulative_mile_marker) {
      const segLen = b.cumulative_mile_marker - a.cumulative_mile_marker
      const t = segLen === 0 ? 0 : (clamped - a.cumulative_mile_marker) / segLen
      return {
        lat: a.lat + t * (b.lat - a.lat),
        lng: a.lng + t * (b.lng - a.lng),
      }
    }
  }

  // Past the end — return final point
  return { lat: sorted[sorted.length - 1].lat, lng: sorted[sorted.length - 1].lng }
}

/**
 * Returns the most recently passed checkpoint name given miles walked.
 */
export function getCurrentLocationName(
  milesWalked: number,
  checkpoints: Array<{ name: string; cumulative_mile_marker: number }>
): string {
  const sorted = [...checkpoints].sort((a, b) => a.cumulative_mile_marker - b.cumulative_mile_marker)
  let current = sorted[0]
  for (const cp of sorted) {
    if (milesWalked >= cp.cumulative_mile_marker) {
      current = cp
    }
  }
  return current.name
}

/**
 * Returns the next upcoming checkpoint name, or null if at/past the finish.
 */
export function getNextLocationName(
  milesWalked: number,
  checkpoints: Array<{ name: string; cumulative_mile_marker: number }>
): string | null {
  const sorted = [...checkpoints].sort((a, b) => a.cumulative_mile_marker - b.cumulative_mile_marker)
  for (const cp of sorted) {
    if (cp.cumulative_mile_marker > milesWalked) {
      return cp.name
    }
  }
  return null
}
