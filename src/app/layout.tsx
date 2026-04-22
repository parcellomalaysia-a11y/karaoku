import './globals.css'
import { LangProvider } from '@/lib/i18n/LangProvider'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Karaoku — Session Management Platform',
  description: 'Session management & queue coordination for groups. Host a room, invite guests via QR, coordinate a shared YouTube queue in real time.',
  openGraph: {
    title: 'Karaoku — Session Management Platform',
    description: 'Host rooms. Coordinate queues. Sync in real time. Groups bring their own YouTube content.',
    type: 'website',
  },
}

export const viewport = {
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
