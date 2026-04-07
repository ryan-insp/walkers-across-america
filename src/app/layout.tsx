import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Ryan's Walk Across America 2026",
  description: 'Tracking every mile from Playa Vista, Los Angeles to Manhattan, New York — 2,900 miles on foot.',
  openGraph: {
    title: "Ryan's Walk Across America 2026",
    description: 'Tracking every mile from Playa Vista, LA to Manhattan, NY — 2,900 miles on foot.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* mapbox-gl CSS — required for the map to render correctly */}
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text-primary antialiased">{children}</body>
    </html>
  )
}
