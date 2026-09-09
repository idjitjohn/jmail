import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AppLayout from '@/components/AppLayout'

export default async function InboxPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const isAdmin = session.email === (process.env.ADMIN_EMAIL || '')

  return <AppLayout userEmail={session.email} isAdmin={isAdmin} />
}
