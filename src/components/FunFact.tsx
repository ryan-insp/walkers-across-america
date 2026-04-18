type FunFactProps = {
  location: string
  fact: string
}

export default function FunFact({ location, fact }: FunFactProps) {
  if (!fact) return null

  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px 64px',
      }}
    >
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 680,
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#4CAF82',
            margin: 0,
            fontWeight: 500,
          }}
        >
          {location}
        </p>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.65,
            color: '#A8B5AE',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          {fact}
        </p>
      </div>
    </section>
  )
}
