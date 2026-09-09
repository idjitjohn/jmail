import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import ProfileSettings from '@/components/ProfileSettings'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <ProfileSettings />
    </SettingsLayout>
  )
}
