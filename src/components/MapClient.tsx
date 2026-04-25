'use client'

import { useState } from 'react'
import Map, { Source, Layer, Marker, Popup, NavigationControl } from 'react-map-gl'
import type { RoutePoint, ProgressData } from '@/lib/types'

interface MapClientProps {
  routePoints: RoutePoint[]
  progress: ProgressData
}

export default function MapClient({ routePoints, progress }: MapClientProps) {
  const [popupInfo, setPopupInfo] = useState<RoutePoint | null>(null)

  const sorted = [...routePoints].sort((a, b) => a.order_index - b.order_index)

  const center = progress.current_position
    ? { longitude: progress.current_position.lng, latitude: progress.current_position.lat, zoom: 5 }
    : { longitude: -98.5795, latitude: 39.8283, zoom: 3.5 }

  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: sorted.map((p) => [p.lng, p.lat]),
    },
  }

  const mapHeight = 480

  return (
    <div style={{ position: 'relative', width: '100%', height: mapHeight }}>
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={center}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Route line — muted base */}
        {sorted.length > 1 && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-bg"
              type="line"
              paint={{
                'line-color': 'rgba(255,255,255,0.08)',
                'line-width': 3,
                'line-opacity': 1,
              }}
            />
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#2EFF8B',
                'line-width': 2.5,
                'line-opacity': 0.55,
                'line-dasharray': [2, 4],
              }}
            />
          </Source>
        )}

        {/* Checkpoint markers */}
        {sorted
          .filter((p) => p.point_type === 'checkpoint')
          .map((p) => (
            <Marker
              key={p.id}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
              onClick={(e) => { e.originalEvent.stopPropagation(); setPopupInfo(p) }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.6)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </Marker>
          ))}

        {/* Start marker */}
        {sorted[0] && (
          <Marker
            longitude={sorted[0].lng}
            latitude={sorted[0].lat}
            anchor="center"
            onClick={(e) => { e.originalEvent.stopPropagation(); setPopupInfo(sorted[0]) }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'transparent',
              border: '2px solid #2EFF8B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 8px rgba(46,255,139,0.3)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2EFF8B' }} />
            </div>
          </Marker>
        )}

        {/* Finish marker */}
        {sorted[sorted.length - 1] && (
          <Marker
            longitude={sorted[sorted.length - 1].lng}
            latitude={sorted[sorted.length - 1].lat}
            anchor="center"
            onClick={(e) => { e.originalEvent.stopPropagation(); setPopupInfo(sorted[sorted.length - 1]) }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
            </div>
          </Marker>
        )}

        {/* Current position — Ryan emoji */}
        {progress.current_position && (
          <Marker
            longitude={progress.current_position.lng}
            latitude={progress.current_position.lat}
            anchor="bottom"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ryan-emoji.png"
              alt="Current position"
              style={{
                height: 78,
                width: 'auto',
                mixBlendMode: 'multiply',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                pointerEvents: 'none',
              }}
            />
          </Marker>
        )}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton
          >
            <div style={{ fontFamily: 'system-ui', padding: '2px 0' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#F5F7F6' }}>
                {popupInfo.name.split(',')[0]}
              </div>
              <div style={{ fontSize: 12, color: '#6B726F', marginTop: 3 }}>
                Mile {popupInfo.cumulative_mile_marker.toLocaleString()}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'rgba(17,20,19,0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <LegendItem color="#2EFF8B" label="Start — Playa Vista, CA" outline />
        <LegendItem color="#2EFF8B" label="Current position" glow />
        <LegendItem color="rgba(255,255,255,0.3)" label="Finish — Manhattan, NY" outline />
      </div>
    </div>
  )
}

function LegendItem({
  color,
  label,
  glow,
  outline,
}: {
  color: string
  label: string
  glow?: boolean
  outline?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: glow ? color : 'transparent',
          border: outline ? `1.5px solid ${color}` : undefined,
          flexShrink: 0,
          boxShadow: glow ? `0 0 6px ${color}` : undefined,
        }}
      />
      <span style={{ fontSize: 12, color: '#A0A7A4', fontFamily: 'system-ui' }}>{label}</span>
    </div>
  )
}
