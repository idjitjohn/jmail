import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import AppearanceSettings from '@/components/AppearanceSettings'

export default async function AppearancePage() {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <AppearanceSettings />
    </SettingsLayout>
  )
}
