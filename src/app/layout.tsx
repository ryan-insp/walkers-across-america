import type { Metadata } from 'next'
import { Inter, Shrikhand, Alfa_Slab_One, Caveat } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Retro postcard lettering
const script = Shrikhand({ weight: '400', subsets: ['latin'], variable: '--font-script', display: 'swap' })
const block = Alfa_Slab_One({ weight: '400', subsets: ['latin'], variable: '--font-block', display: 'swap' })
const hand = Caveat({ subsets: ['latin'], variable: '--font-hand', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://ryanswalk.com'),
  title: "Ryan's Walk Across America 2026",
  description: 'Tracking every mile from Playa Vista, Los Angeles to Manhattan, New York — 3,000 miles on foot.',
  openGraph: {
    title: "Ryan's Walk Across America 2026",
    description: 'Tracking every mile from Playa Vista, LA to Manhattan, NY — 3,000 miles on foot.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${script.variable} ${block.variable} ${hand.variable}`}>
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
