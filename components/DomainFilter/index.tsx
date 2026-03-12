import { DOMAINS } from '@/lib/admin'
import './DomainFilter.scss'

interface Props {
  value: string
  onChange: (domain: string) => void
}

export default function DomainFilter({ value, onChange }: Props) {
  return (
    <div className="DomainFilter">
      <select
        className="select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">All domains</option>
        {DOMAINS.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  )
}
