'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'
import { folderLabel } from '@/lib/i18n/folders'
import Dialog from '../Dialog'
import { useWorkspacePanel } from './useWorkspacePanel'
import type { WorkspaceTab } from './types'
import './WorkspacePanel.scss'

type Props = {
  initialTab: WorkspaceTab
  onClose: () => void
  onCompose: (to: string) => void
}
const WorkspacePanel = ({ initialTab, onClose, onCompose }: Props) => {
  const { t, dateTime, plural, locale } = useLocale()

  const { uploadRef, ...vm } = useWorkspacePanel(initialTab, onCompose, onClose)
  return (
    <Dialog
      title={t('Your workspace')}
      onClose={vm.requestClose}
      busy={vm.busy}
    >
      <div className="WorkspacePanel">
        <nav className="tabs" aria-label={t('Workspace sections')}>
          {(['contacts', 'scheduled', 'later', 'folders'] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                className={vm.tab === tab ? 'active' : ''}
                aria-current={vm.tab === tab ? 'page' : undefined}
                disabled={vm.busy}
                onClick={() => vm.setTab(tab)}
              >
                {tab === 'contacts'
                  ? t('Contacts')
                  : tab === 'scheduled'
                    ? t('Scheduled')
                    : tab === 'later'
                      ? t('Later')
                      : t('Folders')}
              </button>
            ),
          )}
        </nav>
        {vm.error && (
          <p className="error" role="alert">
            {t(vm.error)}
          </p>
        )}
        {vm.notice && (
          <p className="notice" role="status">
            {t(vm.notice)}
          </p>
        )}
        {vm.confirm && (
          <div className="confirmation" role="alert">
            <p>{t(vm.confirm.title)}</p>
            <button type="button" disabled={vm.busy} onClick={vm.confirm.run}>
              {t('Confirm')}
            </button>
            <button
              type="button"
              disabled={vm.busy}
              onClick={() => vm.setConfirm(null)}
            >
              {t('Keep it')}
            </button>
          </div>
        )}
        {vm.loading ? (
          <p className="empty" role="status">
            {t('Loading your workspace…')}
          </p>
        ) : (
          <>
            {vm.tab === 'contacts' && (
              <section className="section">
                <div className="intro">
                  <h3>{t('The people you write to.')}</h3>
                  <p>
                    {t(
                      'Save a contact once, then find them by name when writing a message.',
                    )}
                  </p>
                </div>
                <div className="actions">
                  <input
                    aria-label={t('Search contacts')}
                    type="search"
                    placeholder={t('Search people, companies or groups')}
                    value={vm.query}
                    onChange={(event) => vm.setQuery(event.target.value)}
                  />
                  <button
                    type="button"
                    className="primary"
                    onClick={vm.addContact}
                  >
                    {t('Add contact')}
                  </button>
                  <button type="button" onClick={vm.exportContacts}>
                    {t('Export')}
                  </button>
                  <button
                    type="button"
                    onClick={() => uploadRef.current?.click()}
                  >
                    {t('Import JSON')}
                  </button>
                  <input
                    className="file-input"
                    ref={uploadRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) =>
                      vm.importContacts(event.target.files?.[0])
                    }
                  />
                </div>
                {vm.contact && (
                  <form className="editor" onSubmit={vm.saveContact}>
                    <h4>
                      {vm.contact.id ? t('Edit contact') : t('New contact')}
                    </h4>
                    <fieldset disabled={vm.busy}>
                      {(
                        ['name', 'email', 'company', 'phone', 'group'] as const
                      ).map((field) => (
                        <label key={field}>
                          {field === 'name'
                            ? t('Name')
                            : field === 'email'
                              ? t('Email')
                              : field === 'company'
                                ? t('Company')
                                : field === 'phone'
                                  ? t('Phone')
                                  : t('Group')}
                          <input
                            type={field === 'email' ? 'email' : 'text'}
                            required={field === 'email'}
                            value={vm.contact![field]}
                            onChange={(event) =>
                              vm.setContact((current) =>
                                current
                                  ? { ...current, [field]: event.target.value }
                                  : current,
                              )
                            }
                          />
                        </label>
                      ))}
                    </fieldset>
                    <button
                      className="primary"
                      disabled={vm.busy}
                      type="submit"
                    >
                      {t('Save contact')}
                    </button>
                    <button
                      disabled={vm.busy}
                      type="button"
                      onClick={() => vm.setContact(null)}
                    >
                      {t('Cancel')}
                    </button>
                  </form>
                )}
                <div className="items">
                  {vm.contacts.length === 0 && (
                    <p className="empty">
                      {t(
                        'No contacts here yet. Add someone you write to often.',
                      )}
                    </p>
                  )}
                  {vm.contacts.map((contact) => (
                    <article className="item" key={contact.id}>
                      <div className="details">
                        <strong>{contact.name || contact.email}</strong>
                        <span>
                          {contact.email}
                          {contact.group ? ` · ${contact.group}` : ''}
                        </span>
                        {contact.company && <span>{contact.company}</span>}
                      </div>
                      <div className="item-actions">
                        <button
                          type="button"
                          onClick={() => vm.writeTo(contact.email)}
                        >
                          {t('Write')}
                        </button>
                        <button
                          type="button"
                          onClick={() => vm.setContact(contact)}
                        >
                          {t('Edit')}
                        </button>
                        <button
                          type="button"
                          disabled={vm.busy}
                          onClick={() => vm.deleteContact(contact)}
                        >
                          {t('Remove')}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {vm.tab === 'scheduled' && (
              <section className="section">
                <div className="intro">
                  <h3>{t('Ready when the time is right.')}</h3>
                  <p>
                    {t(
                      'Times are shown in your local timezone. You can change the time or cancel before sending starts.',
                    )}
                  </p>
                </div>
                {vm.scheduleEdit && (
                  <form className="editor" onSubmit={vm.saveSchedule}>
                    <h4>{vm.scheduleEdit.subject}</h4>
                    <fieldset disabled={vm.busy}>
                      <label>
                        {t('Send at')}
                        <input
                          type="datetime-local"
                          required
                          min={vm.minSchedule}
                          value={vm.scheduleEdit.sendAt}
                          onChange={(event) =>
                            vm.setScheduleEdit((current) =>
                              current
                                ? { ...current, sendAt: event.target.value }
                                : current,
                            )
                          }
                        />
                      </label>
                    </fieldset>
                    <button
                      className="primary"
                      disabled={vm.busy}
                      type="submit"
                    >
                      {t('Save sending time')}
                    </button>
                    <button
                      type="button"
                      onClick={() => vm.setScheduleEdit(null)}
                    >
                      {t('Cancel')}
                    </button>
                  </form>
                )}
                <div className="items">
                  {vm.scheduled.length === 0 && (
                    <p className="empty">
                      {t(
                        'No messages waiting to be sent. Use the clock beside Send when writing a message.',
                      )}
                    </p>
                  )}
                  {vm.scheduled.map((item) => (
                    <article className="item" key={item.id}>
                      <div className="details">
                        <strong>{item.subject}</strong>
                        <span>
                          {t('To {recipient} · {date}', {
                            recipient: item.to,
                            date: dateTime(item.sendAt),
                          })}
                        </span>
                        <span>
                          {item.status === 'sending'
                            ? t('Sending…')
                            : item.status === 'failed'
                              ? t('Needs your attention')
                              : t('Scheduled')}
                        </span>
                        {item.error && <p className="error">{t(item.error)}</p>}
                      </div>
                      <div className="item-actions">
                        <button
                          type="button"
                          disabled={vm.busy || item.status === 'sending'}
                          onClick={() => vm.editSchedule(item)}
                        >
                          {t('Change time')}
                        </button>
                        <button
                          type="button"
                          disabled={vm.busy || item.status === 'sending'}
                          onClick={() => vm.cancelSchedule(item)}
                        >
                          {t('Cancel send')}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {vm.tab === 'later' && (
              <section className="section">
                <div className="intro">
                  <h3>{t('Room for what comes next.')}</h3>
                  <p>
                    {t(
                      'Your snoozed messages and follow-up reminders. Due reminders stay here until you dismiss them.',
                    )}
                  </p>
                </div>
                <div className="items">
                  {vm.later.length === 0 && (
                    <p className="empty">
                      {t(
                        'Nothing waiting for later. Open a message and choose Snooze or Remind me.',
                      )}
                    </p>
                  )}
                  {vm.later.map((item) => (
                    <article className="item" key={item.id}>
                      <div className="details">
                        <strong>{item.subject}</strong>
                        <span>
                          {item.mode === 'snooze'
                            ? t('Snoozed')
                            : t('Follow-up')}{' '}
                          · {dateTime(item.dueAt)}
                        </span>
                        <span>
                          {item.status === 'due'
                            ? t('Time to follow up · no reply found in Inbox')
                            : item.status === 'failed'
                              ? t('Needs attention')
                              : item.status === 'processing'
                                ? t('Processing…')
                                : t('Scheduled')}
                        </span>
                        {item.error && <p className="error">{t(item.error)}</p>}
                      </div>
                      <div className="item-actions">
                        <button
                          type="button"
                          disabled={vm.busy || item.status === 'processing'}
                          onClick={() =>
                            vm.updateLater(
                              item,
                              item.mode === 'snooze' ? 'restore' : 'dismiss',
                            )
                          }
                        >
                          {item.mode === 'snooze'
                            ? t('Bring back now')
                            : t('Dismiss')}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {vm.tab === 'folders' && (
              <section className="section">
                <div className="intro">
                  <h3>{t('A place for every conversation.')}</h3>
                  <p>
                    {t(
                      'Create folders for projects, people, or anything you want to keep together.',
                    )}
                  </p>
                </div>
                <form className="editor" onSubmit={vm.saveFolder}>
                  <fieldset disabled={vm.busy}>
                    <label>
                      {vm.editingFolder
                        ? t('Rename {0}', { '0': vm.editingFolder })
                        : t('New folder')}
                      <input
                        required
                        value={vm.folderName}
                        maxLength={160}
                        placeholder={t('For example, Projects')}
                        onChange={(event) =>
                          vm.setFolderName(event.target.value)
                        }
                      />
                    </label>
                  </fieldset>
                  <button className="primary" disabled={vm.busy} type="submit">
                    {vm.editingFolder ? t('Rename folder') : t('Create folder')}
                  </button>
                  {vm.editingFolder && (
                    <button
                      type="button"
                      onClick={() => {
                        vm.setEditingFolder('')
                        vm.setFolderName('')
                      }}
                    >
                      {t('Cancel')}
                    </button>
                  )}
                </form>
                <div className="items">
                  {vm.folders.map((folder) => (
                    <article className="item" key={folder.path}>
                      <div className="details">
                        <strong>{folderLabel(folder, locale)}</strong>
                        <span>
                          {plural(
                            '{count} unread message',
                            '{count} unread messages',
                            folder.unread,
                          )}
                          {vm.protectedFolder(folder)
                            ? t(' · Built-in folder')
                            : ''}
                        </span>
                      </div>
                      {!vm.protectedFolder(folder) && (
                        <div className="item-actions">
                          <button
                            type="button"
                            onClick={() => {
                              vm.setEditingFolder(folder.path)
                              vm.setFolderName(folder.path)
                            }}
                          >
                            {t('Rename')}
                          </button>
                          <button
                            type="button"
                            disabled={vm.busy}
                            onClick={() => vm.deleteFolder(folder)}
                          >
                            {t('Delete')}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Dialog>
  )
}
export default WorkspacePanel
