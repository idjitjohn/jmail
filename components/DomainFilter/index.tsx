'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import './DomainFilter.scss'

type Props = {
  domains: string[]
  value: string
  onChange: (domain: string) => void
}

const DomainFilter = ({ domains, value, onChange }: Props) => {
  const { t } = useLocale()

  return (
    <div className="DomainFilter">
      <select
        className="select"
        aria-label={t('Filter by domain')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t('All domains')}</option>
        {domains.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  )
}

export default DomainFilter
