'use client'

import { useState } from 'react'
import Map, { Source, Layer, Marker, Popup, NavigationControl } from 'react-map-gl'
import type { RoutePoint, ProgressData } from '@/lib/types'
import { splitRoute } from '@/lib/route-data'

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

  // Split route into walked and remaining paths (following roads)
  const maxMile = sorted[sorted.length - 1]?.cumulative_mile_marker ?? 0
  const cappedMiles = Math.min(progress.total_miles, maxMile)

  const { walked: walkedCoords, remaining: remainingCoords } = sorted.length > 1
    ? splitRoute(cappedMiles, sorted)
    : { walked: [], remaining: [] }

  // Where Ryan would be if exactly on goal pace
  const goalMiles = Math.min(progress.target_pace_miles_per_day * progress.days_elapsed, maxMile)
  const ghost = sorted.length > 1 ? splitRoute(goalMiles, sorted).position : null
  const ghostDelta = progress.total_miles - goalMiles

  const walkedGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: walkedCoords },
  }

  const remainingGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: remainingCoords },
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

        {/* Walked portion — solid bright green */}
        {walkedCoords.length > 1 && (
          <Source id="route-walked" type="geojson" data={walkedGeoJSON}>
            <Layer
              id="route-walked-bg"
              type="line"
              paint={{
                'line-color': 'rgba(46,255,139,0.2)',
                'line-width': 5,
                'line-opacity': 1,
              }}
            />
            <Layer
              id="route-walked-line"
              type="line"
              paint={{
                'line-color': '#2EFF8B',
                'line-width': 2.5,
                'line-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* Remaining portion — dim dashed */}
        {remainingCoords.length > 1 && (
          <Source id="route-remaining" type="geojson" data={remainingGeoJSON}>
            <Layer
              id="route-remaining-line"
              type="line"
              paint={{
                'line-color': 'rgba(255,255,255,0.18)',
                'line-width': 2,
                'line-opacity': 1,
                'line-dasharray': [3, 5],
              }}
            />
          </Source>
        )}

        {/* Checkpoint markers */}
        {sorted
          .filter((p) => p.point_type === 'checkpoint')
          .map((p) => {
            const passed = p.cumulative_mile_marker <= cappedMiles
            return (
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
                    background: passed ? 'rgba(46,255,139,0.3)' : 'rgba(255,255,255,0.12)',
                    border: passed ? '1px solid rgba(46,255,139,0.6)' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.6)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </Marker>
            )
          })}

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

        {/* Goal-pace ghost */}
        {ghost && (
          <Marker longitude={ghost.lng} latitude={ghost.lat} anchor="center">
            <div
              title={`Goal pace: mile ${Math.round(goalMiles).toLocaleString()} today (${Math.abs(ghostDelta).toFixed(0)} mi ${ghostDelta >= 0 ? 'behind Ryan' : 'ahead of Ryan'})`}
              style={{ position: 'relative', width: 16, height: 16 }}
            >
              <div style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'rgba(244,241,234,0.18)',
                border: '1.5px dashed rgba(244,241,234,0.75)',
              }} />
              <div style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(244,241,234,0.8)',
                background: 'rgba(20,20,22,0.85)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '2px 7px',
                fontFamily: 'system-ui',
              }}>
                Goal pace
              </div>
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
              <div style={{ fontWeight: 600, fontSize: 13, color: '#F4F1EA' }}>
                {popupInfo.name.split(',')[0]}
              </div>
              <div style={{ fontSize: 12, color: '#8A867E', marginTop: 3 }}>
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
          background: 'rgba(20,20,22,0.9)',
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
        <LegendItem color="#2EFF8B" label="Route walked" line />
        <LegendItem color="rgba(255,255,255,0.3)" label="Route remaining" line dashed />
        <LegendItem color="rgba(244,241,234,0.75)" label="Where goal pace would be" outline dashed />
        <LegendItem color="rgba(255,255,255,0.3)" label="Finish — Manhattan, NY" outline />
      </div>
    </div>
  )
}

function LegendItem({
  color,
  label,
  outline,
  line,
  dashed,
}: {
  color: string
  label: string
  outline?: boolean
  line?: boolean
  dashed?: boolean
}) {
  if (line) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="8" style={{ flexShrink: 0 }}>
          {dashed ? (
            <line
              x1="0" y1="4" x2="16" y2="4"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          ) : (
            <line
              x1="0" y1="4" x2="16" y2="4"
              stroke={color}
              strokeWidth="2.5"
            />
          )}
        </svg>
        <span style={{ fontSize: 12, color: '#B4AFA5', fontFamily: 'system-ui' }}>{label}</span>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'transparent',
          border: outline ? `1.5px ${dashed ? 'dashed' : 'solid'} ${color}` : undefined,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12, color: '#B4AFA5', fontFamily: 'system-ui' }}>{label}</span>
    </div>
  )
}
