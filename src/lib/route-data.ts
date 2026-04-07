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
    name: 'Tucson, AZ',
    lat: 32.2226,
    lng: -110.9747,
    cumulative_mile_marker: 420,
    point_type: 'checkpoint',
  },
  {
    order_index: 5,
    name: 'El Paso, TX',
    lat: 31.7619,
    lng: -106.485,
    cumulative_mile_marker: 650,
    point_type: 'checkpoint',
  },
  {
    order_index: 6,
    name: 'San Antonio, TX',
    lat: 29.4241,
    lng: -98.4936,
    cumulative_mile_marker: 900,
    point_type: 'checkpoint',
  },
  {
    order_index: 7,
    name: 'Austin, TX',
    lat: 30.2672,
    lng: -97.7431,
    cumulative_mile_marker: 1000,
    point_type: 'checkpoint',
  },
  {
    order_index: 8,
    name: 'Dallas, TX',
    lat: 32.7767,
    lng: -96.797,
    cumulative_mile_marker: 1100,
    point_type: 'checkpoint',
  },
  {
    order_index: 9,
    name: 'Oklahoma City, OK',
    lat: 35.4676,
    lng: -97.5164,
    cumulative_mile_marker: 1250,
    point_type: 'checkpoint',
  },
  {
    order_index: 10,
    name: 'Kansas City, MO',
    lat: 39.0997,
    lng: -94.5786,
    cumulative_mile_marker: 1450,
    point_type: 'checkpoint',
  },
  {
    order_index: 11,
    name: 'St. Louis, MO',
    lat: 38.627,
    lng: -90.1994,
    cumulative_mile_marker: 1600,
    point_type: 'checkpoint',
  },
  {
    order_index: 12,
    name: 'Chicago, IL',
    lat: 41.8781,
    lng: -87.6298,
    cumulative_mile_marker: 1800,
    point_type: 'checkpoint',
  },
  {
    order_index: 13,
    name: 'Cleveland, OH',
    lat: 41.4993,
    lng: -81.6944,
    cumulative_mile_marker: 2000,
    point_type: 'checkpoint',
  },
  {
    order_index: 14,
    name: 'Pittsburgh, PA',
    lat: 40.4406,
    lng: -79.9959,
    cumulative_mile_marker: 2200,
    point_type: 'checkpoint',
  },
  {
    order_index: 15,
    name: 'Philadelphia, PA',
    lat: 39.9526,
    lng: -75.1652,
    cumulative_mile_marker: 2400,
    point_type: 'checkpoint',
  },
  {
    order_index: 16,
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
