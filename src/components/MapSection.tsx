'use client'

import dynamic from 'next/dynamic'
import type { ProgressData, RoutePoint } from '@/lib/types'

const MapClient = dynamic(() => import('./MapClient'), { ssr: false })

type MapSectionProps = {
  progress: ProgressData
  routePoints: RoutePoint[]
}

export default function MapSection({ progress, routePoints }: MapSectionProps) {
  return (
    <section
      id="map"
      style={{
        maxWidth: 'var(--site-max)',
        margin: '0 auto',
        padding: '0 var(--site-gutter) 40px var(--site-gutter)'
      }}
    >
      <div className="section-label">
        Route Map
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
          background: '#151517',
          boxShadow: '0 16px 40px rgba(0,0,0,0.24)'
        }}
      >
        <div
          style={{
            height: 'clamp(420px, 38vw, 640px)',
            width: '100%',
            position: 'relative'
          }}
        >
          <MapClient progress={progress} routePoints={routePoints} />
        </div>
      </div>

      <style jsx global>{`
        .mapboxgl-ctrl-top-right {
          top: 16px !important;
          right: 16px !important;
        }

        .mapboxgl-ctrl-group {
          background: rgba(20, 20, 22, 0.88) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28) !important;
          backdrop-filter: blur(10px);
        }

        .mapboxgl-ctrl-group button {
          width: 42px !important;
          height: 42px !important;
          background: transparent !important;
        }

        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        .mapboxgl-ctrl-group button span {
          filter: brightness(0) invert(1);
          opacity: 0.92;
        }

        .mapboxgl-ctrl button:focus {
          box-shadow: none !important;
        }

        .mapboxgl-popup-content {
          background: rgba(20, 20, 22, 0.96) !important;
          color: #F4F1EA !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28) !important;
        }

        .mapboxgl-popup-tip {
          border-top-color: rgba(20, 20, 22, 0.96) !important;
          border-bottom-color: rgba(20, 20, 22, 0.96) !important;
        }

        .mapboxgl-ctrl-logo,
        .mapboxgl-compact-show,
        .mapboxgl-compact-hide {
          opacity: 0.82;
        }

        .mapboxgl-ctrl-attrib {
          background: rgba(20, 20, 22, 0.72) !important;
          color: rgba(244, 241, 234, 0.72) !important;
          border-radius: 10px 0 0 0 !important;
        }

        .mapboxgl-ctrl-attrib a {
          color: rgba(244, 241, 234, 0.72) !important;
        }

        .mapboxgl-canvas {
          outline: none !important;
        }
      `}</style>
    </section>
  )
}