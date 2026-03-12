import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import AdvancedSettings from '@/components/AdvancedSettings'

export default async function AdvancedPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (!token) redirect('/')

  const session = await verifySession(token)
  if (!session) redirect('/')

  return (
    <SettingsLayout userEmail={session.email} isAdmin={session.email === process.env.ADMIN_EMAIL}>
      <AdvancedSettings />
    </SettingsLayout>
  )
}
