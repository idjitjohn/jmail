import { useAdminDashboard } from './useAdminDashboard'
import './AdminDashboard.scss'

type Props = {
  accounts: string[]
  domains: string[]
}

const AdminDashboard = ({ accounts, domains }: Props) => {
  const { byDomain, recent } = useAdminDashboard(accounts, domains)

  return (
    <div className="AdminDashboard">
      <div className="stats-grid">
        <div className="stat-card total">
          <p className="stat-label">Total accounts</p>
          <p className="stat-value">{accounts.length}</p>
        </div>
        {byDomain.map(({ domain, count }) => (
          <div key={domain} className="stat-card">
            <p className="stat-label">{domain}</p>
            <p className="stat-value">{count}</p>
          </div>
        ))}
      </div>

      <div className="recent-section">
        <h2 className="section-title">Recent accounts</h2>
        <div className="recent-list">
          {recent.length === 0 ? (
            <p className="empty">No accounts yet</p>
          ) : (
            recent.map(email => (
              <div key={email} className="recent-item">
                <span className="recent-email">{email}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
