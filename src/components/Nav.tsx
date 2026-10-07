'use client'

/* eslint-disable @next/next/no-img-element */

export default function Nav() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(11,11,12,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--site-max)',
          margin: '0 auto',
          padding: '14px var(--site-gutter)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <a href="/" aria-label="Ryan's Walk — home" style={{ display: 'block', flexShrink: 1, minWidth: 0 }}>
          {/* Full lockup on wider screens, just the route mark on phones */}
          <picture>
            <source media="(max-width: 480px)" srcSet="/brand/mark.png" />
            <img
              src="/brand/lockup.png"
              alt="Ryan's Walk"
              className="site-nav-logo"
              style={{ height: 34, width: 'auto', maxWidth: '100%', display: 'block' }}
            />
          </picture>
        </a>

        <nav
          className="site-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontSize: 14,
            fontWeight: 500,
            color: '#ABA69C',
            flexShrink: 0,
          }}
        >
          <a href="#map" className="site-nav-link">Map</a>
          <a href="#stats" className="site-nav-link">Stats</a>
          <a href="#postcards" className="site-nav-link">Postcards</a>
          <a href="/admin" className="site-nav-link site-nav-admin">Admin →</a>
        </nav>
      </div>
    </header>
  )
}
