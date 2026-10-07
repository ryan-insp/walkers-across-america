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
    <section style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: '0 var(--site-gutter) 88px' }}>
      <div className="section-label">Milestones</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {milestones.map((m) => (
          <div
            key={m.id}
            className="card-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: '#151517',
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
                // City crossings use the brand orange; distance milestones stay green
                background: m.milestone_type === 'checkpoint' ? 'rgba(238,68,23,0.10)' : 'rgba(46,255,139,0.06)',
                border: `1px solid ${m.milestone_type === 'checkpoint' ? 'rgba(238,68,23,0.35)' : 'rgba(46,255,139,0.15)'}`,
                color: m.milestone_type === 'checkpoint' ? '#EE4417' : '#2EFF8B',
                fontSize: 13,
              }}
            >
              {TYPE_ICON[m.milestone_type] ?? '◈'}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#F4F1EA', margin: 0, lineHeight: 1.3 }}>
                {m.title}
              </p>
              {m.body && m.body !== m.title && (
                <p style={{ fontSize: 14, color: '#B4AFA5', margin: '3px 0 0', lineHeight: 1.4 }}>
                  {m.body}
                </p>
              )}
            </div>

            {/* Date */}
            <p style={{ fontSize: 13, color: '#8A867E', flexShrink: 0, margin: 0 }}>
              {format(parseISO(m.milestone_date), 'MMM d')}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
