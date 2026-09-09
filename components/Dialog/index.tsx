'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'
import { useDialog } from './useDialog'
import './Dialog.scss'

type Props = {
  title: string
  onClose: () => void
  busy?: boolean
  children: React.ReactNode
}
const Dialog = ({ title, onClose, busy = false, children }: Props) => {
  const { t } = useLocale()

  const { ref, id, cancel } = useDialog(onClose, busy)
  return (
    <dialog
      className="Dialog"
      aria-modal="true"
      ref={ref}
      aria-labelledby={id}
      onCancel={cancel}
    >
      <div className="heading">
        <h2 id={id}>{title}</h2>
        <button
          type="button"
          aria-label={t('Close')}
          disabled={busy}
          onClick={onClose}
        >
          {t('Close')}
        </button>
      </div>
      <div className="content">{children}</div>
    </dialog>
  )
}
export default Dialog
