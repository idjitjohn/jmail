import { getManagedDomains } from '@/lib/maddy-admin'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminLayout from '@/components/AdminLayout'
import CreateAccountForm from '@/components/CreateAccountForm'
import { ToastProvider } from '@/components/Toast'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export default async function NewAccountPage() {
  const session = await getSession()

  if (!session || session.email !== ADMIN_EMAIL) redirect('/')

  let domains: string[] = []
  try {
    domains = await getManagedDomains()
  } catch {
    /* Unavailable domain configuration */
  }

  return (
    <AdminLayout title="New account">
      <ToastProvider>
        <CreateAccountForm domains={domains} />
      </ToastProvider>
    </AdminLayout>
  )
}
