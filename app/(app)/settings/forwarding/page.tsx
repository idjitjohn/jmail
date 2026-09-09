import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import ForwardingSettings from '@/components/ForwardingSettings'

export default async function ForwardingPage() {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <ForwardingSettings />
    </SettingsLayout>
  )
}
