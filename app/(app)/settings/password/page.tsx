import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import PasswordSettings from '@/components/PasswordSettings'

export default async function PasswordPage() {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <PasswordSettings />
    </SettingsLayout>
  )
}
