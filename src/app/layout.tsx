import type { Metadata } from 'next'
import { Inter, Outfit, Shrikhand, Alfa_Slab_One, Caveat } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Display face for headings and big numbers — geometric, to sit with the logo
const display = Outfit({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display', display: 'swap' })

// Retro postcard lettering
const script = Shrikhand({ weight: '400', subsets: ['latin'], variable: '--font-script', display: 'swap' })
const block = Alfa_Slab_One({ weight: '400', subsets: ['latin'], variable: '--font-block', display: 'swap' })
const hand = Caveat({ subsets: ['latin'], variable: '--font-hand', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ryanswalk.com'),
  title: "Ryan's Walk",
  description: 'Tracking every mile from Playa Vista, Los Angeles to Manhattan, New York — 3,000 miles on foot.',
  openGraph: {
    title: "Ryan's Walk",
    description: 'Tracking every mile from Playa Vista, LA to Manhattan, NY — 3,000 miles on foot.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${script.variable} ${block.variable} ${hand.variable}`}>
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
