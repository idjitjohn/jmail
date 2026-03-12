import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "JMail",
  description: "Webmail for Maddy server",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="/theme-init.js" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
