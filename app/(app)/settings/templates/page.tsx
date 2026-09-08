import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsLayout from '@/components/SettingsLayout'
import TemplateSettings from '@/components/TemplateSettings'

const Page = async () => {
  const session = await getSession()
  if (!session) redirect('/')
  return (
    <SettingsLayout
      userEmail={session.email}
      isAdmin={session.email === process.env.ADMIN_EMAIL}
    >
      <TemplateSettings />
    </SettingsLayout>
  )
}

export default Page
