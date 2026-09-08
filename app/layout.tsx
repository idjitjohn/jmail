import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JMail',
  description: 'Webmail for Atydago.com customers',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- Theme before first paint */}
        <script src="/theme-init.js" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
