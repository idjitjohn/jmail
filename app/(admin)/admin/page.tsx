import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/auth'
import { listAccounts } from '@/lib/maddy'
import AdminLayout from '@/components/AdminLayout'
import AdminDashboard from '@/components/AdminDashboard'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  const session = token ? await verifySession(token) : null

  if (!session || session.email !== ADMIN_EMAIL) redirect('/')

  let accounts: string[] = []
  try { accounts = await listAccounts() } catch { /* server not reachable */ }

  return (
    <AdminLayout title="Dashboard">
      <AdminDashboard accounts={accounts} />
    </AdminLayout>
  )
}
