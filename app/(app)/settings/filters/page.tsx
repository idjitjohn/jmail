import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import FilterSettings from '@/components/FilterSettings'

export default async function FiltersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (!token) redirect('/')

  const session = await verifySession(token)
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <FilterSettings />
    </SettingsLayout>
  )
}
