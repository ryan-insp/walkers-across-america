import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base
        bg:          '#0B0D0C',
        surface:     '#111413',
        card:        '#151917',
        // Text
        primary:     '#F5F7F6',
        secondary:   '#A0A7A4',
        muted:       '#6B726F',
        // Accent
        green:       '#2EFF8B',
        'green-dark':'#1DBE6A',
        // Legacy aliases (keep so nothing breaks)
        background:  '#0B0D0C',
        'surface-2': '#151917',
        accent:      '#2EFF8B',
        'accent-dim':'#1DBE6A',
        'text-primary':   '#F5F7F6',
        'text-secondary': '#A0A7A4',
        'text-muted':     '#6B726F',
        border:      'rgba(255,255,255,0.06)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display scale
        'display-xl': ['112px', { lineHeight: '0.95', letterSpacing: '-0.05em', fontWeight: '700' }],
        'display-l':  ['64px',  { lineHeight: '1.0',  letterSpacing: '-0.04em', fontWeight: '700' }],
        'display-m':  ['48px',  { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading-xl': ['34px',  { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading-l':  ['28px',  { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-m':  ['22px',  { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-l':     ['18px',  { lineHeight: '1.5' }],
        'body-m':     ['16px',  { lineHeight: '1.5' }],
        'body-s':     ['14px',  { lineHeight: '1.45' }],
        'label':      ['13px',  { lineHeight: '1',    letterSpacing: '0.12em',  fontWeight: '600' }],
        'micro':      ['12px',  { lineHeight: '1',    letterSpacing: '0.12em',  fontWeight: '500' }],
      },
      borderRadius: {
        'card': '20px',
        'map':  '24px',
      },
      maxWidth: {
        'site': '1280px',
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease-out both',
        'fade-up-d1': 'fadeUp 0.6s 0.1s ease-out both',
        'fade-up-d2': 'fadeUp 0.6s 0.2s ease-out both',
        'fade-up-d3': 'fadeUp 0.6s 0.3s ease-out both',
        'fade-up-d4': 'fadeUp 0.6s 0.4s ease-out both',
        'fade-up-d5': 'fadeUp 0.6s 0.5s ease-out both',
        'pulse-green': 'pulseGreen 2.5s ease-in-out infinite',
        'bar-fill':    'barFill 1.2s 0.4s cubic-bezier(0.4,0,0.2,1) both',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(46,255,139,0.3)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(46,255,139,0)' },
        },
        barFill: {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
