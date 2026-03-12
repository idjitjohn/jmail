import { DOMAINS } from '@/lib/admin'
import './AdminDashboard.scss'

interface Props {
  accounts: string[]
}

export default function AdminDashboard({ accounts }: Props) {
  const byDomain = DOMAINS.map(domain => ({
    domain,
    count: accounts.filter(a => a.endsWith(`@${domain}`)).length,
  }))

  const recent = [...accounts].reverse().slice(0, 8)

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
