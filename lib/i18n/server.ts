import 'server-only'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { getSession } from '@/lib/auth'
import { getUserData } from '@/lib/userdata'
import { isLocale, localeCookie, preferredLocale } from './config'
import { createTranslator } from './translate'

export const getLocaleState = cache(async () => {
  const [store, requestHeaders, session] = await Promise.all([
    cookies(),
    headers(),
    getSession(),
  ])
  const cookie = store.get(localeCookie)?.value
  let locale = isLocale(cookie)
    ? cookie
    : preferredLocale(requestHeaders.get('accept-language'))
  if (session) {
    const data = await getUserData(session.email).catch(() => null)
    const saved = data?.preferences?.locale
    if (isLocale(saved)) locale = saved
  }
  return { locale, authenticated: Boolean(session) }
})

export const getTranslations = async () =>
  createTranslator((await getLocaleState()).locale)
