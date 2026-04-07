import { format, parseISO } from 'date-fns'
import type { Milestone } from '@/lib/types'

interface MilestonesFeedProps {
  milestones: Milestone[]
}

const TYPE_ICON: Record<string, string> = {
  miles_100:    '◈',
  percent_10:   '◉',
  checkpoint:   '→',
  fastest_week: '↑',
  surprise:     '★',
}

export default function MilestonesFeed({ milestones }: MilestonesFeedProps) {
  if (milestones.length === 0) return null

  return (
    <section className="site-container" style={{ paddingBottom: 88 }}>
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#6B726F',
          marginBottom: 20,
        }}
      >
        Milestones
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {milestones.map((m) => (
          <div
            key={m.id}
            className="card-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: '#151917',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '16px 20px',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'rgba(46,255,139,0.06)',
                border: '1px solid rgba(46,255,139,0.15)',
                color: '#2EFF8B',
                fontSize: 13,
              }}
            >
              {TYPE_ICON[m.milestone_type] ?? '◈'}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F7F6', margin: 0, lineHeight: 1.3 }}>
                {m.title}
              </p>
              {m.body && m.body !== m.title && (
                <p style={{ fontSize: 14, color: '#A0A7A4', margin: '3px 0 0', lineHeight: 1.4 }}>
                  {m.body}
                </p>
              )}
            </div>

            {/* Date */}
            <p style={{ fontSize: 13, color: '#6B726F', flexShrink: 0, margin: 0 }}>
              {format(parseISO(m.milestone_date), 'MMM d')}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
