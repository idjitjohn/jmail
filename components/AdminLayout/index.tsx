'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import AdminSidebar from '../AdminSidebar'
import LanguageSelector from '../LanguageSelector'
import { ToastProvider } from '../Toast'
import './AdminLayout.scss'

interface Props {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: Props) {
  const { t } = useLocale()

  return (
    <ToastProvider>
      <div className="AdminLayout">
        <AdminSidebar />
        <div className="content">
          <div className="page-header">
            <h1 className="page-title">{t(title)}</h1>
            <LanguageSelector />
          </div>
          <div className="page-body">{children}</div>
        </div>
      </div>
    </ToastProvider>
  )
}
