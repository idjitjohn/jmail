import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import ForwardingSettings from '@/components/ForwardingSettings'

export default async function ForwardingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (!token) redirect('/')

  const session = await verifySession(token)
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <ForwardingSettings />
    </SettingsLayout>
  )
}
