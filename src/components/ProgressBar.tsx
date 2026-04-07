'use client'

interface ProgressBarProps {
  percent: number
  className?: string
}

export default function ProgressBar({ percent, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: 8,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 9999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${clamped}%`,
          borderRadius: 9999,
          background: 'linear-gradient(90deg, #1DBE6A 0%, #2EFF8B 100%)',
          boxShadow: clamped > 0 ? '0 0 10px rgba(46,255,139,0.3)' : 'none',
          transformOrigin: 'left center',
          animation: 'barFill 1.2s 0.5s cubic-bezier(0.4,0,0.2,1) both',
        }}
      />
    </div>
  )
}
