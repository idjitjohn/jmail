'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import './Toolbar.scss'

interface ToolbarAction {
  id: string
  label: string
  icon: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  active?: boolean
}

interface Props {
  actions: ToolbarAction[]
}

export default function Toolbar({ actions }: Props) {
  const { t } = useLocale()

  return (
    <div className="Toolbar">
      {actions.map((action) => (
        <button
          key={action.id}
          className={`action${action.danger ? ' danger' : ''}${action.active ? ' active' : ''}`}
          onClick={action.onClick}
          disabled={action.disabled}
          title={t(action.label)}
          aria-label={t(action.label)}
          type="button"
        >
          <span className={`icon icon-${action.icon}`} />
          <span className="label">{t(action.label)}</span>
        </button>
      ))}
    </div>
  )
}
