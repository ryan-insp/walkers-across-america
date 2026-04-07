import { format, parseISO, differenceInDays, startOfWeek, endOfWeek } from 'date-fns'
import type { DailyActivity, Challenge, Milestone, RoutePoint } from './types'
import { effectiveMiles } from './progress'

// ============================================================
// Milestone generation logic
// Runs on the server. Produces upsertable Milestone records.
// ============================================================

interface GeneratedMilestone {
  milestone_type: Milestone['milestone_type']
  title: string
  body: string
  milestone_date: string
  trigger_value: number | null
  is_auto_generated: true
  is_visible: true
}

/**
 * Generate all milestones from raw activity data.
 * This is idempotent — re-running produces the same set.
 * Existing milestones with the same type + trigger_value should be upserted.
 */
export function generateMilestones(
  activities: DailyActivity[],
  challenge: Challenge,
  routePoints: RoutePoint[]
): GeneratedMilestone[] {
  const milestones: GeneratedMilestone[] = []
  const sorted = [...activities].sort((a, b) => a.activity_date.localeCompare(b.activity_date))

  let runningMiles = 0
  let lastHundredMilestone = -1
  let lastPercentMilestone = -1

  // Sort route checkpoints for crossing detection
  const checkpoints = [...routePoints].sort((a, b) => a.cumulative_mile_marker - b.cumulative_mile_marker)
  const crossedCheckpoints = new Set<number>()

  for (const activity of sorted) {
    const dayMiles = effectiveMiles(activity)
    const prevMiles = runningMiles
    runningMiles += dayMiles

    const dateStr = activity.activity_date

    // ── Every 100 miles ────────────────────────────────────────
    const currentHundred = Math.floor(runningMiles / 100)
    if (currentHundred > lastHundredMilestone && currentHundred > 0) {
      for (let h = lastHundredMilestone + 1; h <= currentHundred; h++) {
        milestones.push({
          milestone_type: 'miles_100',
          title: `${h * 100} miles down.`,
          body: hundredMileBody(h * 100),
          milestone_date: dateStr,
          trigger_value: h * 100,
          is_auto_generated: true,
          is_visible: true,
        })
      }
      lastHundredMilestone = currentHundred
    }

    // ── Every 10% ──────────────────────────────────────────────
    const pct = (runningMiles / challenge.target_miles) * 100
    const currentTen = Math.floor(pct / 10)
    if (currentTen > lastPercentMilestone && currentTen > 0 && pct < 100) {
      for (let p = lastPercentMilestone + 1; p <= currentTen; p++) {
        milestones.push({
          milestone_type: 'percent_10',
          title: `${p * 10}% complete.`,
          body: percentBody(p * 10),
          milestone_date: dateStr,
          trigger_value: p * 10,
          is_auto_generated: true,
          is_visible: true,
        })
      }
      lastPercentMilestone = currentTen
    }

    // ── 100% complete ──────────────────────────────────────────
    if (pct >= 100 && lastPercentMilestone < 10) {
      milestones.push({
        milestone_type: 'percent_10',
        title: 'Manhattan. You made it.',
        body: 'Playa Vista to Manhattan. 2,900 miles on foot. Done.',
        milestone_date: dateStr,
        trigger_value: 100,
        is_auto_generated: true,
        is_visible: true,
      })
      lastPercentMilestone = 10
    }

    // ── Checkpoint crossing ────────────────────────────────────
    for (const cp of checkpoints) {
      if (
        cp.point_type !== 'start' &&
        !crossedCheckpoints.has(cp.order_index) &&
        prevMiles < cp.cumulative_mile_marker &&
        runningMiles >= cp.cumulative_mile_marker
      ) {
        crossedCheckpoints.add(cp.order_index)
        const city = cp.name.split(',')[0]
        milestones.push({
          milestone_type: 'checkpoint',
          title: `${city} is behind you.`,
          body: checkpointBody(cp.name, cp.cumulative_mile_marker),
          milestone_date: dateStr,
          trigger_value: cp.cumulative_mile_marker,
          is_auto_generated: true,
          is_visible: true,
        })
      }
    }
  }

  // ── Fastest week ───────────────────────────────────────────
  const fastestWeekMilestone = detectFastestWeek(sorted, challenge)
  if (fastestWeekMilestone) milestones.push(fastestWeekMilestone)

  // Deduplicate by type + trigger_value (keep first occurrence)
  const seen = new Set<string>()
  return milestones.filter((m) => {
    const key = `${m.milestone_type}:${m.trigger_value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Body copy helpers ──────────────────────────────────────

function hundredMileBody(miles: number): string {
  const messages: Record<number, string> = {
    100: 'First hundred in the books.',
    200: 'Two hundred miles. Still moving.',
    300: 'Three hundred down. The desert is behind you.',
    500: 'Five hundred miles walked.',
    1000: 'A thousand miles. Halfway isn\'t far now.',
    1450: 'Kansas City range. Middle of the country.',
    1800: 'Chicago territory.',
    2000: 'Two thousand miles logged.',
    2500: 'Final stretch. The coast is close.',
    2900: 'Full route completed.',
  }
  return messages[miles] ?? `${miles} miles walked since January 1.`
}

function percentBody(pct: number): string {
  const messages: Record<number, string> = {
    10: 'Ten percent. The rest of the country is ahead.',
    20: 'Twenty percent done.',
    25: 'Quarter of the way there.',
    30: 'Thirty percent.',
    40: 'Four out of ten.',
    50: 'Past the halfway mark.',
    60: 'Sixty percent. More behind you than ahead.',
    70: 'Seventy percent.',
    75: 'Three quarters done.',
    80: 'Eighty percent. Almost there.',
    90: 'Ninety percent. The finish is visible.',
  }
  return messages[pct] ?? `${pct}% of the route walked.`
}

function checkpointBody(fullName: string, miles: number): string {
  const city = fullName.split(',')[0]
  return `Symbolic crossing at ${city} — mile ${miles.toLocaleString()} on the route.`
}

function detectFastestWeek(
  sorted: DailyActivity[],
  challenge: Challenge
): GeneratedMilestone | null {
  if (sorted.length < 7) return null

  // Group by week
  const weeks: Record<string, number> = {}
  for (const a of sorted) {
    const weekKey = format(startOfWeek(parseISO(a.activity_date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    weeks[weekKey] = (weeks[weekKey] ?? 0) + effectiveMiles(a)
  }

  const entries = Object.entries(weeks)
  if (entries.length < 2) return null

  // Find max week
  let maxWeek = entries[0]
  for (const e of entries) {
    if (e[1] > maxWeek[1]) maxWeek = e
  }

  const weekEnd = format(endOfWeek(parseISO(maxWeek[0]), { weekStartsOn: 1 }), 'MMM d')
  const weekStart = format(parseISO(maxWeek[0]), 'MMM d')

  return {
    milestone_type: 'fastest_week',
    title: 'Fastest week of the year.',
    body: `${weekStart}–${weekEnd}: ${maxWeek[1].toFixed(1)} miles walked in a single week.`,
    milestone_date: maxWeek[0],
    trigger_value: Math.round(maxWeek[1] * 10) / 10,
    is_auto_generated: true,
    is_visible: true,
  }
}
