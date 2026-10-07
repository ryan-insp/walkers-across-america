type HeroProps = {
  milesWalked?: number
  targetMiles?: number
  percentComplete?: number
  currentLocation?: string
  nextStop?: { city: string; milesToGo: number } | null
  aheadBehindText?: string
  isAhead?: boolean
}

export default function Hero({
  milesWalked = 0,
  targetMiles = 3000,
  percentComplete = 0,
  currentLocation = 'Playa Vista',
  nextStop = null,
  aheadBehindText = 'On pace',
  isAhead = true,
}: HeroProps) {
  const pct = Math.min(100, Math.max(0, percentComplete))

  return (
    <section style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: '48px var(--site-gutter) 40px' }}>
      <div className="section-label" style={{ color: '#EE4417' }}>
        Playa Vista, CA → Manhattan, NY · 2026
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 'clamp(2.25rem, 7vw, 4.25rem)',
          lineHeight: 1,
          letterSpacing: '-0.035em',
          fontWeight: 800,
          color: '#F4F1EA',
          margin: '0 0 12px',
        }}
      >
        Ryan&apos;s Walk
      </h1>
      <p style={{ fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', color: '#ABA69C', margin: '0 0 36px', maxWidth: 560, lineHeight: 1.5 }}>
        {targetMiles.toLocaleString('en-US')} miles on foot across America, one day of steps at a time.
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        <span
          className="font-display"
          style={{
            fontSize: 'clamp(3.5rem, 12vw, 6.5rem)',
            fontWeight: 800,
            color: '#2EFF8B',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
          }}
        >
          {milesWalked.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
        <span style={{ fontSize: 'clamp(1rem, 2.4vw, 1.25rem)', color: '#ABA69C' }}>
          of {targetMiles.toLocaleString('en-US')} miles
        </span>
      </div>

      {/* Progress bar with an orange "you are here" marker */}
      <div style={{ position: 'relative', height: 10, borderRadius: 999, background: '#232326', margin: '0 0 10px' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, rgba(46,255,139,0.55), #2EFF8B)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: `${pct}%`,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#EE4417',
            border: '3px solid #0B0B0C',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 4px rgba(238,68,23,0.25)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8A867E', marginBottom: 28 }}>
        <span>Playa Vista</span>
        <span style={{ color: '#2EFF8B', fontWeight: 600 }}>{pct.toFixed(1)}% complete</span>
        <span>Manhattan</span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Chip>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EE4417', boxShadow: '0 0 0 3px rgba(238,68,23,0.25)' }} />
          <span style={{ color: '#8A867E' }}>Now in</span>
          <span style={{ color: '#F4F1EA', fontWeight: 600 }}>{currentLocation}</span>
        </Chip>
        {nextStop && (
          <Chip>
            <span style={{ color: '#8A867E' }}>Next stop</span>
            <span style={{ color: '#F4F1EA', fontWeight: 600 }}>{nextStop.city}</span>
            <span style={{ color: '#8A867E' }}>· {Math.ceil(nextStop.milesToGo)} mi</span>
          </Chip>
        )}
        <Chip>
          <span style={{ color: isAhead ? '#2EFF8B' : '#F87171', fontWeight: 600 }}>{aheadBehindText}</span>
          <span style={{ color: '#8A867E' }}>vs goal pace</span>
        </Chip>
      </div>
    </section>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 14px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: 14,
      }}
    >
      {children}
    </div>
  )
}
