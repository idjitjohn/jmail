import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import AdvancedSettings from '@/components/AdvancedSettings'

export default async function AdvancedPage() {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <AdvancedSettings />
    </SettingsLayout>
  )
}
