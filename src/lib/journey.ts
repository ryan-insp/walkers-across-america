import { format, parseISO, startOfWeek, addDays } from 'date-fns'
import type { DailyActivity, RoutePoint } from './types'
import { effectiveMiles } from './progress'

// ============================================================
// Derived journey data: checkpoint arrival dates and daily
// activity stats. Computed from daily_activity on each render,
// so past arrivals are backdated automatically.
// ============================================================

export interface CheckpointArrival {
  order_index: number
  name: string
  mile: number
  date: string // yyyy-MM-dd
}

/** Date each checkpoint (excluding the start) was first reached */
export function checkpointArrivals(activities: DailyActivity[], routePoints: RoutePoint[]): CheckpointArrival[] {
  const sorted = [...activities].sort((a, b) => a.activity_date.localeCompare(b.activity_date))
  const checkpoints = [...routePoints]
    .filter((p) => p.point_type !== 'start')
    .sort((a, b) => a.cumulative_mile_marker - b.cumulative_mile_marker)

  const arrivals: CheckpointArrival[] = []
  let running = 0
  let next = 0
  for (const a of sorted) {
    running += effectiveMiles(a)
    while (next < checkpoints.length && running >= checkpoints[next].cumulative_mile_marker) {
      const cp = checkpoints[next]
      arrivals.push({ order_index: cp.order_index, name: cp.name, mile: cp.cumulative_mile_marker, date: a.activity_date })
      next++
    }
  }
  return arrivals
}

export interface ActivityDay {
  date: string // yyyy-MM-dd
  miles: number
}

export interface ActivityStats {
  days: ActivityDay[]
  bestDay: ActivityDay | null
  bestWeek: { start: string; miles: number } | null
  goalDays: number
  longestGoalStreak: number
  currentGoalStreak: number
}

/** Per-day miles plus best day/week and streaks of days at or above the daily goal */
export function activityStats(activities: DailyActivity[], dailyGoalMiles: number): ActivityStats {
  const days = [...activities]
    .sort((a, b) => a.activity_date.localeCompare(b.activity_date))
    .map((a) => ({ date: a.activity_date, miles: effectiveMiles(a) }))

  let bestDay: ActivityDay | null = null
  const weeks: Record<string, number> = {}
  let goalDays = 0
  let streak = 0
  let longestGoalStreak = 0
  let prevDate: string | null = null

  for (const d of days) {
    if (!bestDay || d.miles > bestDay.miles) bestDay = d

    const weekKey = format(startOfWeek(parseISO(d.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    weeks[weekKey] = (weeks[weekKey] ?? 0) + d.miles

    // A missing day breaks the streak
    const consecutive = prevDate !== null && format(addDays(parseISO(prevDate), 1), 'yyyy-MM-dd') === d.date
    if (d.miles >= dailyGoalMiles) {
      goalDays++
      streak = consecutive || prevDate === null ? streak + 1 : 1
      longestGoalStreak = Math.max(longestGoalStreak, streak)
    } else {
      streak = 0
    }
    prevDate = d.date
  }

  // Today's partial day shouldn't break the current streak
  const last = days[days.length - 1]
  let currentGoalStreak = streak
  if (last && last.miles < dailyGoalMiles) {
    currentGoalStreak = 0
    for (let i = days.length - 2; i >= 0 && days[i].miles >= dailyGoalMiles; i--) currentGoalStreak++
  }

  const bestWeekEntry = Object.entries(weeks).reduce<[string, number] | null>(
    (best, e) => (!best || e[1] > best[1] ? e : best),
    null
  )

  return {
    days,
    bestDay,
    bestWeek: bestWeekEntry ? { start: bestWeekEntry[0], miles: bestWeekEntry[1] } : null,
    goalDays,
    longestGoalStreak,
    currentGoalStreak,
  }
}
