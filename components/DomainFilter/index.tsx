import './DomainFilter.scss'

type Props = {
  domains: string[]
  value: string
  onChange: (domain: string) => void
}

const DomainFilter = ({ domains, value, onChange }: Props) => {
  return (
    <div className="DomainFilter">
      <select
        className="select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">All domains</option>
        {domains.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  )
}

export default DomainFilter
