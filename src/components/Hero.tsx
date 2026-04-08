'use client'

type HeroProps = {
  milesWalked?: number
  percentComplete?: number
  currentLocation?: string
}

export default function Hero({
  milesWalked = 0,
  percentComplete = 0,
  currentLocation = 'Playa Vista'
}: HeroProps) {
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px'
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#6B726F',
          marginBottom: 12
        }}
      >
        Playa Vista, CA → Manhattan, NY
      </div>

      <h1
        style={{
          fontSize: 'clamp(1.6rem, 5vw, 3rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          fontWeight: 700,
          color: '#F5F7F6',
          marginBottom: 24
        }}
      >
        Ryan’s Walk Across America 2026
      </h1>

      <div
        style={{
          fontSize: 'clamp(3rem, 10vw, 5rem)',
          fontWeight: 700,
          color: '#2EFF8B',
          lineHeight: 1,
          marginBottom: 6
        }}
      >
        {milesWalked.toFixed(1)}
      </div>

      <div
        style={{
          color: '#8A9390',
          fontSize: 16,
          marginBottom: 20
        }}
      >
        miles walked
      </div>

      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 999,
          background: '#1E2321',
          marginBottom: 10,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${percentComplete}%`,
            height: '100%',
            background: '#2EFF8B',
            borderRadius: 999,
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: '#7C8481',
          marginBottom: 20
        }}
      >
        <div>0 mi</div>
        <div style={{ color: '#2EFF8B' }}>
          {percentComplete.toFixed(1)}%
        </div>
        <div>3,000 mi</div>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#F5F7F6',
          fontSize: 14
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#4ADE80'
          }}
        />
        <span style={{ color: '#E6F4EA', fontWeight: 500 }}>Now</span>
        <span style={{ color: '#8A9390' }}>{currentLocation}</span>
      </div>
    </section>
  )
}