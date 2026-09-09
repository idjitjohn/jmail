'use client'

import { useMailActionMenu } from './useMailActionMenu'
import type { MailAction } from './types'
import './MailActionMenu.scss'

type Props = {
  actions: MailAction[]
  label: string
  placement?: 'above' | 'below'
}

const MailActionMenu = ({ actions, label, placement = 'below' }: Props) => {
  const { rootRef, onBlur, triggerRef, t, open, panelId, toggle, choose } =
    useMailActionMenu()

  return (
    <div
      className={`MailActionMenu ${placement}`}
      ref={rootRef}
      onBlur={onBlur}
    >
      <button
        className="trigger"
        type="button"
        ref={triggerRef}
        aria-label={t(label)}
        title={t(label)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      />
      {open && (
        <div
          className="options"
          id={panelId}
          role="group"
          aria-label={t(label)}
        >
          {actions.map((action) =>
            action.href ? (
              <a
                key={action.id}
                className={`option ${action.icon}`}
                href={action.href}
                download={action.download}
                onClick={() => choose(action)}
              >
                {t(action.label)}
              </a>
            ) : (
              <button
                key={action.id}
                type="button"
                className={`option ${action.icon}${action.danger ? ' danger' : ''}`}
                disabled={action.disabled}
                aria-pressed={action.active}
                onClick={() => choose(action)}
              >
                {t(action.label)}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default MailActionMenu
