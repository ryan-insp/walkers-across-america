'use client'

export default function Nav() {
  return (
    <header
      style={{
        width: '100%',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0B0F0E'
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div
          style={{
            color: '#F5F7F6',
            fontWeight: 600,
            minWidth: 0,
            flex: 1
          }}
        >
          <span className="nav-title-desktop">Ryan’s Walk Across America 2026</span>
          <span className="nav-title-mobile">Ryan’s Walk</span>
        </div>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 14,
            color: '#8A9390',
            flexShrink: 0
          }}
        >
          <a style={{ textDecoration: 'none', color: 'inherit' }}>Map</a>
          <a style={{ textDecoration: 'none', color: 'inherit' }}>Stats</a>
          <span className="admin-link">
            <a style={{ textDecoration: 'none', color: 'inherit' }}>Admin →</a>
          </span>
        </nav>
      </div>

      <style jsx>{`
        .nav-title-desktop,
        .nav-title-mobile {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 12px;
        }

        .nav-title-mobile {
          display: none;
        }

        @media (max-width: 640px) {
          .nav-title-desktop {
            display: none;
          }

          .nav-title-mobile {
            display: block;
          }
        }

        @media (max-width: 520px) {
          .admin-link {
            display: none;
          }
        }
      `}</style>
    </header>
  )
}