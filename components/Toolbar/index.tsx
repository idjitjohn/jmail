import './Toolbar.scss'

interface ToolbarAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface Props {
  actions: ToolbarAction[]
}

export default function Toolbar({ actions }: Props) {
  return (
    <div className="Toolbar">
      {actions.map(action => (
        <button
          key={action.id}
          className={`action${action.danger ? ' danger' : ''}`}
          onClick={action.onClick}
          disabled={action.disabled}
          title={action.label}
          type="button"
        >
          <span className="icon">{action.icon}</span>
          <span className="label">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
