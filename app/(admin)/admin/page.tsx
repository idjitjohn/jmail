import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin'
import { getManagedDomains } from '@/lib/maddy-admin'
import { listAccounts } from '@/lib/maddy'
import AdminLayout from '@/components/AdminLayout'
import AdminAccounts from '@/components/AdminAccounts'

const AdminPage = async () => {
  if (!(await getAdminSession())) redirect('/')
  let accounts: string[] = []
  let domains: string[] = []
  let error = ''
  try {
    accounts = await listAccounts()
  } catch {
    error =
      'Mailboxes could not be loaded. Check the server connection and try again.'
  }
  try {
    domains = await getManagedDomains()
  } catch {
    domains = [...new Set(accounts.map((email) => email.split('@')[1]))]
  }
  return (
    <AdminLayout title="Mailboxes">
      <AdminAccounts
        initialAccounts={accounts}
        domains={domains}
        initialError={error}
      />
    </AdminLayout>
  )
}
export default AdminPage
