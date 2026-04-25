type CityPhotoProps = {
  cityName: string
  photoUrl: string | null
  photographerName: string | null
  photographerUrl: string | null
}

export default function CityPhoto({
  cityName,
  photoUrl,
  photographerName,
  photographerUrl,
}: CityPhotoProps) {
  if (!photoUrl) return null

  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px 40px 24px',
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#6B726F',
          fontWeight: 500,
          marginBottom: 12,
        }}
      >
        Currently In
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.24)',
          height: 320,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={cityName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* City name + attribution overlay — bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '48px 24px 20px 24px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#F5F7F6',
              letterSpacing: '-0.02em',
            }}
          >
            {cityName}
          </span>

          {photographerName && (
            <a
              href={`${photographerUrl}?utm_source=walkers_across_america&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              Photo by {photographerName} / Unsplash
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
