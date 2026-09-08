'use client'
import Dialog from '../Dialog'
import { useLaterDialog } from './useLaterDialog'
import type { MailMessage } from '@/lib/types'
import './LaterDialog.scss'

type Props = {
  message: MailMessage
  mode: 'snooze' | 'reminder'
  onClose: () => void
  onSaved: () => void
}
const LaterDialog = ({ message, mode, onClose, onSaved }: Props) => {
  const vm = useLaterDialog(message, mode, onSaved)
  return (
    <Dialog
      title={
        mode === 'snooze'
          ? 'Make time for this later'
          : 'Follow up on this message'
      }
      onClose={onClose}
      busy={vm.busy}
    >
      <form className="LaterDialog" onSubmit={vm.save}>
        <strong>{message.subject}</strong>
        <p>
          {mode === 'snooze'
            ? 'Move this message to Snoozed. It will return unread to its original folder after the time you choose.'
            : 'Add a reminder to Later if no reply is found in your Inbox by this time.'}
        </p>
        <div className="presets">
          {vm.presets.map((preset) => (
            <button
              type="button"
              key={preset.label}
              onClick={() => vm.setDueAt(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label>
          When
          <input
            type="datetime-local"
            required
            value={vm.dueAt}
            onChange={(event) => vm.setDueAt(event.target.value)}
          />
        </label>
        {vm.error && (
          <p className="error" role="alert">
            {vm.error}
          </p>
        )}
        <button className="primary" type="submit" disabled={vm.busy}>
          {vm.busy
            ? 'Saving…'
            : mode === 'snooze'
              ? 'Snooze message'
              : 'Set reminder'}
        </button>
      </form>
    </Dialog>
  )
}
export default LaterDialog
