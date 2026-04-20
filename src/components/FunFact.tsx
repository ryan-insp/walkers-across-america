'use client'

import { useEffect, useState } from 'react'

type FunFactProps = {
  location: string
}

export default function FunFact({ location }: FunFactProps) {
  const [fact, setFact] = useState<string>('')

  useEffect(() => {
    if (!location) return
    fetch(`/api/fun-fact?location=${encodeURIComponent(location)}`)
      .then((r) => r.json())
      .then((data) => setFact(data.fact ?? ''))
      .catch(() => {})
  }, [location])

  if (!fact) return null

  const city = location.split(',')[0]

  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px 80px',
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '40px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative quote mark */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 16,
            right: 32,
            fontSize: 120,
            lineHeight: 1,
            color: 'rgba(76,175,130,0.08)',
            fontFamily: 'Georgia, serif',
            userSelect: 'none',
          }}
        >
          &ldquo;
        </span>

        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#4CAF82',
            margin: '0 0 20px',
            fontWeight: 600,
          }}
        >
          Fun fact · {city}
        </p>

        <p
          style={{
            fontSize: 19,
            lineHeight: 1.7,
            color: '#C8D4CC',
            margin: 0,
            fontStyle: 'italic',
            fontWeight: 300,
          }}
        >
          {fact}
        </p>
      </div>
    </section>
  )
}
