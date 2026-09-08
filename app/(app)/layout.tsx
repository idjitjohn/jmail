import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserData } from '@/lib/userdata'
import { normalizePreferences } from '@/lib/preferences'
import PreferencesProvider from '@/components/PreferencesProvider'

type Props = { children: ReactNode }

const AppLayout = async ({ children }: Props) => {
  const session = await getSession()
  if (!session) redirect('/')
  let preferences = normalizePreferences(undefined)
  let error = ''
  try {
    preferences = normalizePreferences(
      (await getUserData(session.email)).preferences,
    )
  } catch {
    error =
      'Your saved preferences are unavailable. Default preferences are in use.'
  }
  return (
    <PreferencesProvider
      key={session.email}
      initialPreferences={preferences}
      initialError={error}
    >
      {children}
    </PreferencesProvider>
  )
}

export default AppLayout
