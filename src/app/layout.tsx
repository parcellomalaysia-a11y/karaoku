import './globals.css'
import { LangProvider } from '@/lib/i18n/LangProvider'
import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Karaoku — Sing, Party, Win',
  description: 'Your phone is the microphone. Turn any room into a karaoke party.',
  openGraph: {
    title: 'Karaoku — Your phone is the microphone',
    description: 'Turn any room into a karaoke party. Queue songs from YouTube, sing through your phone.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#E60012',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}