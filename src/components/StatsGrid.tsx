'use client'

type StatsGridProps = {
  totalMiles?: number
  totalSteps?: number
  percentComplete?: number
  paceDeltaText?: string
  etaText?: string
  currentPositionTitle?: string
  currentPositionSubtitle?: string
}

export default function StatsGrid({
  totalMiles = 0,
  totalSteps = 0,
  percentComplete = 0,
  paceDeltaText = '762.7 mi behind',
  etaText = 'Start walking to estimate',
  currentPositionTitle = 'Playa Vista',
  currentPositionSubtitle = 'Los Angeles, CA'
}: StatsGridProps) {
  const cardStyle: React.CSSProperties = {
    background: '#151917',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 24,
    minHeight: 168,
    boxShadow: '0 10px 24px rgba(0,0,0,0.18)'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#7C8481',
    fontWeight: 600,
    marginBottom: 18
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 'clamp(2rem, 4vw, 2.5rem)',
    lineHeight: 1,
    letterSpacing: '-0.04em',
    fontWeight: 700,
    color: '#F5F7F6',
    marginBottom: 12
  }

  const subStyle: React.CSSProperties = {
    fontSize: 16,
    lineHeight: 1.45,
    color: '#8A9390'
  }

  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '8px 24px 48px 24px'
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#6B726F',
          fontWeight: 500,
          marginBottom: 16
        }}
      >
        2026 Stats
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20
        }}
      >
        <div style={cardStyle}>
          <div style={labelStyle}>Miles Walked</div>
          <div style={valueStyle}>{totalMiles}</div>
          <div style={subStyle}>Target: 3,000 mi</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Steps Taken</div>
          <div style={valueStyle}>{totalSteps.toLocaleString()}</div>
          <div style={subStyle}>Target: 6,000,000 steps</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Complete</div>
          <div
            style={{
              ...valueStyle,
              color: '#2EFF8B',
              textShadow: '0 0 14px rgba(46,255,139,0.16)'
            }}
          >
            {percentComplete.toFixed(1)}%
          </div>
          <div style={subStyle}>Progress of full route</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Pace vs Goal</div>
          <div
            style={{
              fontSize: 'clamp(1.75rem, 3.6vw, 2rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              color: '#F5F7F6',
              marginBottom: 10
            }}
          >
            {paceDeltaText}
          </div>
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.45,
              color: '#F87171'
            }}
          >
            Behind target pace
          </div>
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.45,
              color: '#8A9390',
              marginTop: 6
            }}
          >
            Target: 8.2 mi/day · Actual: 0.0 mi/day
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Est. Arrival</div>
          <div style={valueStyle}>—</div>
          <div style={subStyle}>{etaText}</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Current Position</div>
          <div
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.25rem)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
              fontWeight: 700,
              color: '#F5F7F6',
              marginBottom: 10
            }}
          >
            {currentPositionTitle}
          </div>
          <div style={subStyle}>{currentPositionSubtitle}</div>
        </div>
      </div>
    </section>
  )
}