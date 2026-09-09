import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import FilterSettings from '@/components/FilterSettings'

export default async function FiltersPage() {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <FilterSettings />
    </SettingsLayout>
  )
}
