import type { Metadata } from 'next'
import LocaleProvider from '@/components/LocaleProvider'
import { getLocaleState, getTranslations } from '@/lib/i18n/server'
import { languageTags } from '@/lib/i18n/config'
import './globals.css'

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations()
  return { title: 'JMail', description: t('Webmail for Atydago.com customers') }
}

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const { locale, authenticated } = await getLocaleState()
  return (
    <html lang={languageTags[locale]} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- Theme before first paint */}
        <script src="/theme-init.js" />
      </head>
      <body className="antialiased">
        <LocaleProvider initialLocale={locale} authenticated={authenticated}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}

export default RootLayout
