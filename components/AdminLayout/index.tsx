import AdminSidebar from '../AdminSidebar'
import { ToastProvider } from '../Toast'
import './AdminLayout.scss'

interface Props {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: Props) {
  return (
    <ToastProvider>
      <div className="AdminLayout">
        <AdminSidebar />
        <div className="content">
          <div className="page-header">
            <h1 className="page-title">{title}</h1>
          </div>
          <div className="page-body">{children}</div>
        </div>
      </div>
    </ToastProvider>
  )
}
