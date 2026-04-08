'use client'

/* eslint-disable @next/next/no-img-element */

export default function Nav() {
  return (
    <header
      style={{
        width: '100%',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0B0F0E',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <img
          src="/logo.png"
          alt="Ryan's Walk Across America 2026"
          style={{
            height: 72,
            width: 'auto',
            display: 'block',
          }}
        />

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 14,
            color: '#8A9390',
            flexShrink: 0,
          }}
        >
          <a href="#map" style={{ textDecoration: 'none', color: 'inherit' }}>Map</a>
          <a href="#stats" style={{ textDecoration: 'none', color: 'inherit' }}>Stats</a>
          <a href="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>Admin →</a>
        </nav>
      </div>
    </header>
  )
}
