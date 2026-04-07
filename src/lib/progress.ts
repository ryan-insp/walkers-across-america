import { differenceInDays, format, addDays, parseISO } from 'date-fns'
import type { DailyActivity, Challenge, ProgressData } from './types'
import { interpolatePosition, getCurrentLocationName, getNextLocationName } from './route-data'

const STEPS_TO_MILES = 2000 // steps per mile when no distance available

/** Convert a single daily record to an effective miles value */
export function effectiveMiles(activity: DailyActivity): number {
  if (activity.miles !== null && activity.miles > 0) return activity.miles
  if (activity.steps !== null && activity.steps > 0) return activity.steps / STEPS_TO_MILES
  return 0
}

/** Compute total miles and steps from all daily activities */
export function computeTotals(activities: DailyActivity[]): { total_miles: number; total_steps: number } {
  let total_miles = 0
  let total_steps = 0

  for (const a of activities) {
    total_miles += effectiveMiles(a)
    total_steps += a.steps ?? 0
  }

  return { total_miles, total_steps }
}

/**
 * Compute the full ProgressData object from raw inputs.
 * This is the single source of truth for all progress stats.
 */
export function computeProgress(
  activities: DailyActivity[],
  challenge: Challenge,
  routePoints: Array<{ name: string; lat: number; lng: number; cumulative_mile_marker: number }>
): ProgressData {
  const { total_miles, total_steps } = computeTotals(activities)
  const capped_miles = Math.min(total_miles, challenge.target_miles)

  const percent_complete = challenge.target_miles > 0
    ? Math.min(100, (total_miles / challenge.target_miles) * 100)
    : 0

  // Days elapsed since Jan 1 of the challenge year
  const start = parseISO(challenge.start_date)
  const today = new Date()
  const days_elapsed = Math.max(1, differenceInDays(today, start))

  const target_pace_miles_per_day = challenge.target_miles / 365
  const actual_pace_miles_per_day = days_elapsed > 0 ? total_miles / days_elapsed : 0

  const expected_miles_by_today = target_pace_miles_per_day * days_elapsed
  const ahead_behind_miles = total_miles - expected_miles_by_today

  // ETA based on current pace
  let estimated_arrival_date: string | null = null
  if (actual_pace_miles_per_day > 0.01 && total_miles < challenge.target_miles) {
    const miles_remaining = challenge.target_miles - total_miles
    const days_remaining = Math.ceil(miles_remaining / actual_pace_miles_per_day)
    const eta = addDays(today, days_remaining)
    estimated_arrival_date = format(eta, 'MMMM d, yyyy')
  } else if (total_miles >= challenge.target_miles) {
    estimated_arrival_date = 'Complete'
  }

  // Map position
  const current_position = routePoints.length > 0
    ? interpolatePosition(capped_miles, routePoints)
    : null

  const current_location_name = routePoints.length > 0
    ? getCurrentLocationName(capped_miles, routePoints)
    : challenge.start_location_name

  const next_location_name = routePoints.length > 0
    ? getNextLocationName(capped_miles, routePoints)
    : null

  return {
    total_miles,
    total_steps,
    percent_complete,
    days_elapsed,
    actual_pace_miles_per_day,
    target_pace_miles_per_day,
    ahead_behind_miles,
    estimated_arrival_date,
    current_location_name,
    next_location_name,
    current_position,
    latest_milestone_text: null, // populated separately
  }
}

/** Format a pace as "X.X mi/day" */
export function formatPace(milesPerDay: number): string {
  return `${milesPerDay.toFixed(1)} mi/day`
}

/** Format miles with commas */
export function formatMiles(miles: number): string {
  return miles.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** Format steps with commas */
export function formatSteps(steps: number): string {
  return steps.toLocaleString('en-US')
}

/** Format ahead/behind as "+12.3 mi ahead" or "8.1 mi behind" */
export function formatAheadBehind(miles: number): string {
  if (Math.abs(miles) < 0.1) return 'On pace'
  const abs = Math.abs(miles).toFixed(1)
  return miles > 0 ? `+${abs} mi ahead` : `${abs} mi behind`
}
