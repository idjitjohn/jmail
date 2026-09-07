import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin'
import AdminLayout from '@/components/AdminLayout'
import MailServerAdmin from '@/components/MailServerAdmin'

const MailServerPage = async () => {
  const session = await getAdminSession()
  if (!session) redirect('/')
  return <AdminLayout title="Mail server"><MailServerAdmin adminEmail={session.email} /></AdminLayout>
}

export default MailServerPage
