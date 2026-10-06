'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'

export type PostcardData = {
  orderIndex: number
  city: string
  state: string
  mile: number
  date: string // yyyy-MM-dd arrival
  fact: string
  photoUrl: string
  photographerName: string
  photographerUrl: string
}

type PostcardsProps = {
  postcards: PostcardData[] // newest first
  totalCities: number
  nextStop: { city: string; milesToGo: number } | null
}

// Slight, stable tilt per card so the gallery looks pinned up by hand
const TILTS = [-1.6, 1.1, -0.6, 1.7, -1.2, 0.5, -1.9, 1.4, -0.4, 0.9, -1.4, 1.8, -0.8, 0.3]

export default function Postcards({ postcards, totalCities, nextStop }: PostcardsProps) {
  if (postcards.length === 0 && !nextStop) return null

  return (
    <section id="postcards" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B726F', fontWeight: 500 }}>
          Postcards From the Road
        </div>
        <div style={{ fontSize: 13, color: '#6B726F' }}>
          {postcards.length} of {totalCities} collected · tap a card to flip it
        </div>
      </div>

      <div className="postcard-grid">
        {nextStop && <NextStopCard city={nextStop.city} milesToGo={nextStop.milesToGo} />}
        {postcards.map((p) => (
          <Postcard key={p.orderIndex} card={p} tilt={TILTS[p.orderIndex % TILTS.length]} />
        ))}
      </div>
    </section>
  )
}

function Postcard({ card, tilt }: { card: PostcardData; tilt: number }) {
  const [flipped, setFlipped] = useState(false)
  const letters = card.city.toUpperCase()
  // Shrink the big letters for long names so they always fit on one line
  const letterSize = `min(19cqw, ${(112 / Math.max(letters.length, 4)).toFixed(1)}cqw)`
  const arrived = parseISO(card.date)

  return (
    <div className="postcard-tilt" style={{ transform: `rotate(${tilt}deg)` }}>
      <div
        role="button"
        tabIndex={0}
        className="postcard"
        aria-pressed={flipped}
        aria-label={`Postcard from ${card.city}. ${flipped ? 'Showing back' : 'Showing front'}. Tap to flip.`}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setFlipped((f) => !f)
          }
        }}
      >
        <div className={`postcard-inner${flipped ? ' is-flipped' : ''}`}>
          {/* ── Front: "Greetings from" large-letter card ── */}
          <div className="postcard-face postcard-front">
            <div className="postcard-scene">
              <div className="postcard-photo" style={{ backgroundImage: `url(${card.photoUrl})` }} />
              <div className="postcard-greetings">Greetings from</div>
              <div className="postcard-letters" style={{ fontSize: letterSize }}>
                <span className="postcard-letters-shadow">{letters}</span>
                <span className="postcard-letters-fill" style={{ backgroundImage: `url(${card.photoUrl})` }}>
                  {letters}
                </span>
              </div>
              <div className="postcard-state">{card.state}</div>
            </div>
            <div className="postcard-caption">
              <span>Mile {card.mile.toLocaleString('en-US')}</span>
              <span>{format(arrived, 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* ── Back: handwritten note, stamp, postmark ── */}
          <div className="postcard-face postcard-back">
            <div className="postcard-message">
              <p>{card.fact}</p>
              <p className="postcard-signoff">Wish you were here! — Ryan</p>
            </div>
            <div className="postcard-divider" />
            <div className="postcard-address">
              <div className="postcard-stamp-row">
                <div className="postcard-postmark">
                  <span>{card.city.toUpperCase()}</span>
                  <strong>{format(arrived, 'MMM d').toUpperCase()}</strong>
                  <span>{format(arrived, 'yyyy')}</span>
                </div>
                <div className="postcard-cancel" aria-hidden />
                <div className="postcard-stamp">
                  <div style={{ backgroundImage: `url(${card.photoUrl})` }} />
                  <span>{card.mile.toLocaleString('en-US')}</span>
                </div>
              </div>
              <div className="postcard-lines">
                <span>Everyone following along</span>
                <span>ryanswalk.com</span>
                <span>Mile {card.mile.toLocaleString('en-US')} of 3,000</span>
              </div>
              <a
                className="postcard-credit"
                href={`${card.photographerUrl}?utm_source=walkers_across_america&utm_medium=referral`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Photo: {card.photographerName} / Unsplash
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NextStopCard({ city, milesToGo }: { city: string; milesToGo: number }) {
  return (
    <div className="postcard-tilt" style={{ transform: 'rotate(0.8deg)' }}>
      <div className="postcard postcard-next">
        <div className="postcard-next-inner">
          <div className="postcard-greetings postcard-greetings-muted">Next stop</div>
          <div className="postcard-next-city">{city}</div>
          <div className="postcard-next-miles">{Math.ceil(milesToGo).toLocaleString('en-US')} miles to go</div>
          <div className="postcard-next-hint">This postcard arrives when Ryan does.</div>
        </div>
      </div>
    </div>
  )
}
