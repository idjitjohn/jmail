import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import AppLayout from '@/components/AppLayout'

export default async function InboxPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (!token) redirect('/')

  const session = await verifySession(token)
  if (!session) redirect('/')

  return <AppLayout userEmail={session.email} />
}
