'use client'

import { useEffect, useRef } from 'react'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import type { ActivityStats } from '@/lib/journey'

type ActivityCalendarProps = {
  stats: ActivityStats
  year: number
  today: string // yyyy-MM-dd in Pacific time
  dailyGoalMiles: number
}

const CELL = 12
const GAP = 3

function cellColor(miles: number | undefined, goal: number, future: boolean): string {
  if (future) return 'rgba(255,255,255,0.02)'
  if (miles === undefined || miles <= 0) return 'rgba(255,255,255,0.05)'
  if (miles < 3) return 'rgba(46,255,139,0.16)'
  if (miles < 6) return 'rgba(46,255,139,0.32)'
  if (miles < goal) return 'rgba(46,255,139,0.52)'
  if (miles < 12) return 'rgba(46,255,139,0.78)'
  return '#2EFF8B'
}

export default function ActivityCalendar({ stats, year, today, dailyGoalMiles }: ActivityCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // On narrow screens, start scrolled to the most recent weeks
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  const milesByDate = new Map(stats.days.map((d) => [d.date, d.miles]))
  const gridStart = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })
  const yearEnd = format(new Date(year, 11, 31), 'yyyy-MM-dd')

  const weeks: Array<Array<{ date: string; inYear: boolean }>> = []
  for (let d = gridStart; format(d, 'yyyy-MM-dd') <= yearEnd; d = addDays(d, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = format(addDays(d, i), 'yyyy-MM-dd')
        return { date, inYear: date.startsWith(String(year)) }
      })
    )
  }

  // Month label goes on the first week that contains the 1st of that month
  const monthLabels = weeks.map((week) => {
    const first = week.find((c) => c.inYear && c.date.endsWith('-01'))
    return first ? format(parseISO(first.date), 'MMM') : ''
  })

  const tiles = [
    {
      label: 'Best day',
      value: stats.bestDay ? `${stats.bestDay.miles.toFixed(1)} mi` : '—',
      sub: stats.bestDay ? format(parseISO(stats.bestDay.date), 'MMM d') : '',
    },
    {
      label: 'Best week',
      value: stats.bestWeek ? `${stats.bestWeek.miles.toFixed(1)} mi` : '—',
      sub: stats.bestWeek ? `Week of ${format(parseISO(stats.bestWeek.start), 'MMM d')}` : '',
    },
    {
      label: 'Goal days',
      value: `${stats.goalDays}`,
      sub: `of ${stats.days.length} days ≥ ${dailyGoalMiles.toFixed(1)} mi`,
    },
    {
      label: 'Longest streak',
      value: `${stats.longestGoalStreak} ${stats.longestGoalStreak === 1 ? 'day' : 'days'}`,
      sub: stats.currentGoalStreak > 0 ? `Current: ${stats.currentGoalStreak}` : 'At goal pace',
    },
  ]

  return (
    <section id="activity" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 56px' }}>
      <div
        style={{
          fontSize: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#6B726F',
          fontWeight: 500,
          marginBottom: 12,
        }}
      >
        Every Day of {year}
      </div>

      <div
        style={{
          background: '#151917',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {tiles.map((t) => (
            <div key={t.label}>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7C8481', fontWeight: 600 }}>
                {t.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#F5F7F6', letterSpacing: '-0.03em', marginTop: 6 }}>
                {t.value}
              </div>
              <div style={{ fontSize: 12, color: '#6B726F', marginTop: 2 }}>{t.sub}</div>
            </div>
          ))}
        </div>

        <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: 4 }}>
          {/* Full-width grid: label column + one column per week; cells stay square */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `28px repeat(${weeks.length}, minmax(${CELL}px, 1fr))`,
              gridTemplateRows: 'auto',
              gap: GAP,
              minWidth: 28 + weeks.length * (CELL + GAP),
            }}
          >
            {monthLabels.map((m, i) =>
              m ? (
                <div
                  key={`m${i}`}
                  style={{ gridColumn: i + 2, gridRow: 1, fontSize: 10, color: '#6B726F', whiteSpace: 'nowrap', paddingBottom: 3 }}
                >
                  {m}
                </div>
              ) : null
            )}
            {['Mon', '', 'Wed', '', 'Fri', '', ''].map((d, i) => (
              <div
                key={`d${i}`}
                style={{ gridColumn: 1, gridRow: i + 2, fontSize: 10, color: '#6B726F', display: 'flex', alignItems: 'center' }}
              >
                {d}
              </div>
            ))}
            {weeks.map((week, wi) =>
              week.map((c, di) => {
                const miles = milesByDate.get(c.date)
                const future = c.date > today
                return (
                  <div
                    key={c.date}
                    title={c.inYear ? `${format(parseISO(c.date), 'EEE, MMM d')}: ${future ? 'upcoming' : `${(miles ?? 0).toFixed(1)} mi`}` : undefined}
                    style={{
                      gridColumn: wi + 2,
                      gridRow: di + 2,
                      aspectRatio: '1',
                      borderRadius: 3,
                      // Days outside the year keep the grid a clean rectangle
                      background: c.inYear ? cellColor(miles, dailyGoalMiles, future) : 'rgba(255,255,255,0.02)',
                      outline: c.date === today ? '1px solid rgba(245,247,246,0.6)' : undefined,
                    }}
                  />
                )
              })
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 11, color: '#6B726F', flexWrap: 'wrap' }}>
          <span>Less</span>
          {[0, 2, 4, 7, 10, 14].map((m) => (
            <span key={m} style={{ width: CELL, height: CELL, borderRadius: 3, background: cellColor(m, dailyGoalMiles, false) }} />
          ))}
          <span>More</span>
          <span style={{ marginLeft: 12 }}>Two brightest shades = hit the {dailyGoalMiles.toFixed(1)} mi/day goal</span>
        </div>
      </div>
    </section>
  )
}
