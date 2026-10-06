import routeGeometry from './route-geometry.json'

// ============================================================
// Canonical route checkpoint data
// Used for seeding and as the source of truth for the map.
// Cumulative miles are real driving distances between
// cities (~3,194 mi total), scaled so Manhattan lands at
// the 3,000-mile goal.
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
    cumulative_mile_marker: 23,
    point_type: 'checkpoint',
  },
  {
    order_index: 2,
    name: 'Palm Springs, CA',
    lat: 33.8303,
    lng: -116.5453,
    cumulative_mile_marker: 122,
    point_type: 'checkpoint',
  },
  {
    order_index: 3,
    name: 'Phoenix, AZ',
    lat: 33.4484,
    lng: -112.074,
    cumulative_mile_marker: 371,
    point_type: 'checkpoint',
  },
  {
    order_index: 4,
    name: 'Albuquerque, NM',
    lat: 35.0844,
    lng: -106.6504,
    cumulative_mile_marker: 765,
    point_type: 'checkpoint',
  },
  {
    order_index: 5,
    name: 'Santa Fe, NM',
    lat: 35.687,
    lng: -105.9378,
    cumulative_mile_marker: 826,
    point_type: 'checkpoint',
  },
  {
    order_index: 6,
    name: 'Amarillo, TX',
    lat: 35.2220,
    lng: -101.8313,
    cumulative_mile_marker: 1089,
    point_type: 'checkpoint',
  },
  {
    order_index: 7,
    name: 'Oklahoma City, OK',
    lat: 35.4676,
    lng: -97.5164,
    cumulative_mile_marker: 1333,
    point_type: 'checkpoint',
  },
  {
    order_index: 8,
    name: 'Kansas City, MO',
    lat: 39.0997,
    lng: -94.5786,
    cumulative_mile_marker: 1662,
    point_type: 'checkpoint',
  },
  {
    order_index: 9,
    name: 'St. Louis, MO',
    lat: 38.627,
    lng: -90.1994,
    cumulative_mile_marker: 1896,
    point_type: 'checkpoint',
  },
  {
    order_index: 10,
    name: 'Chicago, IL',
    lat: 41.8781,
    lng: -87.6298,
    cumulative_mile_marker: 2175,
    point_type: 'checkpoint',
  },
  {
    order_index: 11,
    name: 'Cleveland, OH',
    lat: 41.4993,
    lng: -81.6944,
    cumulative_mile_marker: 2499,
    point_type: 'checkpoint',
  },
  {
    order_index: 12,
    name: 'Pittsburgh, PA',
    lat: 40.4406,
    lng: -79.9959,
    cumulative_mile_marker: 2624,
    point_type: 'checkpoint',
  },
  {
    order_index: 13,
    name: 'Philadelphia, PA',
    lat: 39.9526,
    lng: -75.1652,
    cumulative_mile_marker: 2911,
    point_type: 'checkpoint',
  },
  {
    order_index: 14,
    name: 'Manhattan, New York, NY',
    lat: 40.7831,
    lng: -73.9712,
    cumulative_mile_marker: 3000,
    point_type: 'finish',
  },
]

/** Returns the total route distance (last checkpoint cumulative_mile_marker) */
export const TOTAL_ROUTE_MILES = ROUTE_CHECKPOINTS[ROUTE_CHECKPOINTS.length - 1].cumulative_mile_marker

type LngLat = [number, number]

/** Road-following shape of each leg between consecutive checkpoints */
const LEG_GEOMETRY = new Map<string, LngLat[]>(
  (routeGeometry.legs as Array<{ from: number; to: number; coords: LngLat[] }>).map((l) => [
    `${l.from}-${l.to}`,
    l.coords,
  ])
)

type RouteCheckpoint = { lat: number; lng: number; cumulative_mile_marker: number; order_index?: number }

/** Coordinates for the leg a → b: the road shape if we have one, else a straight line */
function legCoords(a: RouteCheckpoint, b: RouteCheckpoint): LngLat[] {
  const shape = a.order_index !== undefined && b.order_index !== undefined
    ? LEG_GEOMETRY.get(`${a.order_index}-${b.order_index}`)
    : undefined
  return shape ?? [[a.lng, a.lat], [b.lng, b.lat]]
}

/** Approximate distance between two points (equirectangular — fine for proportions along a leg) */
function segLength(p: LngLat, q: LngLat): number {
  const x = (q[0] - p[0]) * Math.cos(((p[1] + q[1]) / 2) * (Math.PI / 180))
  const y = q[1] - p[1]
  return Math.hypot(x, y)
}

/** Split a polyline at fraction t (0–1) of its length */
function splitAt(coords: LngLat[], t: number): { before: LngLat[]; point: LngLat; after: LngLat[] } {
  const lengths = coords.slice(1).map((c, i) => segLength(coords[i], c))
  const total = lengths.reduce((sum, l) => sum + l, 0)
  let target = t * total
  for (let i = 0; i < lengths.length; i++) {
    if (target <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] === 0 ? 0 : Math.min(1, target / lengths[i])
      const a = coords[i]
      const b = coords[i + 1]
      const point: LngLat = [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])]
      return { before: [...coords.slice(0, i + 1), point], point, after: [point, ...coords.slice(i + 1)] }
    }
    target -= lengths[i]
  }
  return { before: coords, point: coords[coords.length - 1], after: [coords[coords.length - 1]] }
}

/**
 * Split the whole route at the given distance walked.
 * Returns the walked and remaining paths (following roads) and the current position.
 */
export function splitRoute(
  milesWalked: number,
  checkpoints: RouteCheckpoint[]
): { walked: LngLat[]; remaining: LngLat[]; position: { lat: number; lng: number } } {
  const sorted = [...checkpoints].sort((a, b) => a.cumulative_mile_marker - b.cumulative_mile_marker)
  const clamped = Math.max(0, Math.min(milesWalked, sorted[sorted.length - 1].cumulative_mile_marker))

  const walked: LngLat[] = []
  const remaining: LngLat[] = []
  let position = { lat: sorted[sorted.length - 1].lat, lng: sorted[sorted.length - 1].lng }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    const coords = legCoords(a, b)
    if (clamped >= b.cumulative_mile_marker) {
      walked.push(...coords)
    } else if (clamped <= a.cumulative_mile_marker) {
      remaining.push(...coords)
    } else {
      const segLen = b.cumulative_mile_marker - a.cumulative_mile_marker
      const { before, point, after } = splitAt(coords, (clamped - a.cumulative_mile_marker) / segLen)
      walked.push(...before)
      remaining.push(...after)
      position = { lng: point[0], lat: point[1] }
    }
  }

  if (clamped <= sorted[0].cumulative_mile_marker) position = { lat: sorted[0].lat, lng: sorted[0].lng }
  return { walked, remaining, position }
}

/**
 * Interpolate a geographic position along the route given a distance traveled.
 * Follows the road shape of each leg; returns { lat, lng } clamped to the route bounds.
 */
export function interpolatePosition(
  milesWalked: number,
  checkpoints: RouteCheckpoint[]
): { lat: number; lng: number } {
  return splitRoute(milesWalked, checkpoints).position
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
 * Reverse geocodes a lat/lng to a "City, ST" string using Mapbox.
 * Cached for 1 hour via Next.js fetch cache.
 * Returns null if the request fails — callers should fall back to checkpoint name.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  mapboxToken: string
): Promise<string | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place&limit=1`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null

    const city = feature.text as string
    const regionCtx = (feature.context ?? []).find((c: { id: string }) =>
      c.id.startsWith('region')
    )
    const stateCode = regionCtx?.short_code?.replace('US-', '') ?? ''
    return stateCode ? `${city}, ${stateCode}` : city
  } catch {
    return null
  }
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
