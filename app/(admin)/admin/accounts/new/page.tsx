import { getManagedDomains } from '@/lib/maddy-admin'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/auth'
import AdminLayout from '@/components/AdminLayout'
import CreateAccountForm from '@/components/CreateAccountForm'
import { ToastProvider } from '@/components/Toast'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function NewAccountPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  const session = token ? await verifySession(token) : null

  if (!session || session.email !== ADMIN_EMAIL) redirect('/')

  let domains: string[] = []
  try { domains = await getManagedDomains() } catch { /* Unavailable domain configuration */ }

  return (
    <AdminLayout title="New account">
      <ToastProvider>
        <CreateAccountForm domains={domains} />
      </ToastProvider>
    </AdminLayout>
  )
}
