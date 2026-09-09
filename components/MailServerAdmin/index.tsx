'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import { useMailServerAdmin } from './useMailServerAdmin'
import './MailServerAdmin.scss'

type Props = { adminEmail: string }

const MailServerAdmin = ({ adminEmail }: Props) => {
  const { t, dateTime } = useLocale()

  const { previewRef, formRef, ...vm } = useMailServerAdmin(adminEmail)

  return (
    <div className="MailServerAdmin">
      <div className="intro">
        <div className="heading">
          <h2>{t('Mail server')}</h2>
          <p>{t('Manage domains, forwarding, and delivery from one place.')}</p>
        </div>
        <button
          type="button"
          disabled={vm.busy || vm.loading}
          onClick={vm.refresh}
        >
          {t('Refresh server')}
        </button>
      </div>
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
      {vm.loading && (
        <p className="loading" role="status">
          {t('Connecting to Maddy…')}
        </p>
      )}
      {!vm.loading && !vm.state && (
        <section className="setup">
          <h3>{t('Connect server administration')}</h3>
          <p>
            {t(
              'On the Linux server running JMail and Maddy, run this from the JMail project directory. Replace APP_USER with the Linux user running JMail.',
            )}
          </p>
          <pre>sudo sh scripts/install-maddy-admin.sh APP_USER</pre>
          <p>
            {t(
              'The helper supports /etc/maddy/maddy.conf, /usr/local/bin/maddy, and the maddy systemd service. Existing custom routing is preserved; unsupported layouts return an explanation before any change.',
            )}
          </p>
        </section>
      )}
      {vm.state && (
        <>
          <p className={vm.state.active ? 'notice' : 'error'}>
            {t('Maddy is {status}. Primary domain: {domain}', {
              status: t(vm.state.active ? 'running' : 'not running'),
              domain: vm.state.primaryDomain,
            })}
          </p>
          <nav className="server-tabs" aria-label={t('Server sections')}>
            {['domains', 'forwarding', 'diagnostics', 'activity'].map((tab) => (
              <button
                type="button"
                key={tab}
                disabled={vm.busy || Boolean(vm.preview)}
                aria-current={vm.tab === tab ? 'page' : undefined}
                className={vm.tab === tab ? 'active' : ''}
                onClick={() => vm.selectTab(tab)}
              >
                {tab === 'domains'
                  ? t('Domains')
                  : tab === 'forwarding'
                    ? t('Routing & rules')
                    : tab === 'activity'
                      ? t('Server activity')
                      : t('Delivery tests')}
              </button>
            ))}
          </nav>
          {vm.tab === 'domains' && (
            <section className="domains">
              <div className="section-heading">
                <h3>{t('Your email domains')}</h3>
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={() => vm.editDomain()}
                >
                  {t('Add domain')}
                </button>
              </div>
              <div className="domain-list">
                {vm.state.domains.map((domain) => (
                  <button
                    type="button"
                    className={
                      vm.original === domain.name ? 'domain selected' : 'domain'
                    }
                    key={domain.name}
                    disabled={vm.busy}
                    onClick={() => vm.editDomain(domain)}
                  >
                    <strong>{domain.name}</strong>
                    <span>{domain.mxHost}</span>
                    <span>
                      {domain.dkimRecord
                        ? t('DKIM key available')
                        : t('DKIM key needs checking')}
                    </span>
                  </button>
                ))}
              </div>
              {vm.editingDomain && (
                <form
                  ref={formRef}
                  className="domain-form"
                  onSubmit={vm.previewDomain}
                >
                  <h4>
                    {vm.original
                      ? t('Edit {0}', { '0': vm.original })
                      : t('New domain')}
                  </h4>
                  <p>
                    {t(
                      '1. Enter the domain details. 2. Review and save. 3. Publish the DNS records and check delivery.',
                    )}
                  </p>
                  <fieldset disabled={vm.busy}>
                    <label>
                      {t('Domain')}
                      <input
                        required
                        value={vm.domain.name}
                        placeholder={t('example.org')}
                        onChange={(e) =>
                          vm.updateDomain(
                            'name',
                            e.target.value.toLowerCase().trim(),
                          )
                        }
                      />
                    </label>
                    <label>
                      {t('Public mail hostname')}
                      <input
                        required
                        value={vm.domain.mxHost}
                        placeholder={t('smtp.example.org')}
                        onChange={(e) =>
                          vm.updateDomain(
                            'mxHost',
                            e.target.value.toLowerCase().trim(),
                          )
                        }
                      />
                    </label>
                    <label>
                      {t('Sending IPv4')}
                      <input
                        value={vm.domain.ipv4}
                        placeholder={t('Server’s outgoing IPv4')}
                        onChange={(e) =>
                          vm.updateDomain('ipv4', e.target.value.trim())
                        }
                      />
                    </label>
                    <label>
                      {t('Sending IPv6')}
                      <input
                        value={vm.domain.ipv6}
                        placeholder={t('Server’s outgoing IPv6, if enabled')}
                        onChange={(e) =>
                          vm.updateDomain('ipv6', e.target.value.trim())
                        }
                      />
                    </label>
                    <label>
                      {t('DKIM selector')}
                      <input
                        required
                        value={vm.domain.selector}
                        onChange={(e) =>
                          vm.updateDomain(
                            'selector',
                            e.target.value.toLowerCase().trim(),
                          )
                        }
                      />
                    </label>
                  </fieldset>
                  <button className="primary" disabled={vm.busy} type="submit">
                    {t('Review changes')}
                  </button>
                  <button
                    type="button"
                    disabled={vm.busy}
                    onClick={() => {
                      vm.setEditingDomain(false)
                      vm.setPreview(null)
                    }}
                  >
                    {t('Cancel')}
                  </button>
                  {vm.original && (
                    <button
                      type="button"
                      disabled={vm.busy}
                      onClick={() => vm.checkDomain(vm.original)}
                    >
                      {t('Check this domain’s DNS')}
                    </button>
                  )}
                </form>
              )}
              {!vm.editingDomain && (
                <p>
                  {t(
                    'Select a domain to update it, or add a domain for new email addresses.',
                  )}
                </p>
              )}
            </section>
          )}
          {vm.tab === 'forwarding' && (
            <section className="forwarding">
              <div className="section-heading">
                <h3>{t('Automatic forwarding')}</h3>
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={() => {
                    vm.setEditingForward(true)
                    vm.setForward({
                      source: '',
                      destination: '',
                      keepCopy: true,
                    })
                    vm.setPreview(null)
                  }}
                >
                  {t('Add forwarding')}
                </button>
              </div>
              <p>
                {t(
                  'Forward incoming messages using Maddy’s delivery rules. Choose a final destination; local forwarding chains are blocked. External delivery still depends on the original message’s authentication.',
                )}
              </p>
              <div className="filter-status">
                <div className="copy">
                  <strong>{t('Mailbox sorting rules')}</strong>
                  <p>
                    {vm.state.filtersReady
                      ? t(
                          'Rules saved by your users run when Maddy receives a message.',
                        )
                      : t('Connect users’ sorting rules to incoming delivery.')}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={vm.toggleFilters}
                >
                  {vm.state.filtersReady
                    ? t('Disable sorting rules')
                    : t('Enable sorting rules')}
                </button>
              </div>
              <div className="rule-list">
                {vm.state.forwarding.length === 0 && (
                  <p>{t('No forwarding rules managed by JMail yet.')}</p>
                )}
                {vm.state.forwarding.map((rule) => (
                  <div className="rule" key={rule.source}>
                    <span>
                      {rule.source} → {rule.destination}
                      {rule.keepCopy ? t(' · Keep a copy') : ''}
                    </span>
                    <button
                      type="button"
                      disabled={vm.busy}
                      onClick={() => {
                        vm.setEditingForward(true)
                        vm.setForward(rule)
                        vm.setPreview(null)
                      }}
                    >
                      {t('Edit')}
                    </button>
                    <button
                      type="button"
                      disabled={vm.busy}
                      onClick={() => vm.removeForward(rule.source)}
                    >
                      {t('Remove')}
                    </button>
                  </div>
                ))}
              </div>
              {vm.editingForward && (
                <form className="forward-form" onSubmit={vm.previewForward}>
                  <fieldset disabled={vm.busy}>
                    <label>
                      {t('Existing mailbox')}
                      <input
                        required
                        type="email"
                        value={vm.forward.source}
                        onChange={(e) => {
                          vm.setForward((f) => ({
                            ...f,
                            source: e.target.value,
                          }))
                          vm.setPreview(null)
                        }}
                      />
                    </label>
                    <label>
                      {t('Forward to')}
                      <input
                        required
                        type="email"
                        value={vm.forward.destination}
                        onChange={(e) => {
                          vm.setForward((f) => ({
                            ...f,
                            destination: e.target.value,
                          }))
                          vm.setPreview(null)
                        }}
                      />
                    </label>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={vm.forward.keepCopy}
                        onChange={(e) => {
                          vm.setForward((f) => ({
                            ...f,
                            keepCopy: e.target.checked,
                          }))
                          vm.setPreview(null)
                        }}
                      />
                      {t('Keep a copy in the original mailbox')}
                    </label>
                  </fieldset>
                  <button type="submit" disabled={vm.busy}>
                    {t('Review changes')}
                  </button>
                  <button
                    type="button"
                    disabled={vm.busy}
                    onClick={() => {
                      vm.setEditingForward(false)
                      vm.setPreview(null)
                    }}
                  >
                    {t('Cancel')}
                  </button>
                </form>
              )}
            </section>
          )}
          {vm.preview && (
            <section
              ref={previewRef}
              tabIndex={-1}
              className="preview"
              aria-label={t('Configuration preview')}
            >
              <h3>{t('Review changes')}</h3>
              <p>
                {t(
                  'Maddy will validate the configuration, back up the current files, and restart. Active mail connections may briefly reconnect. Failed changes restore the previous configuration.',
                )}
              </p>
              <div className="change-summary">
                {vm.preview.change.kind === 'domain' && (
                  <>
                    <strong>
                      {vm.preview.change.original ? t('Update') : t('Add')}{' '}
                      {vm.preview.change.domain?.name}
                    </strong>
                    <p>
                      {t(
                        'Accept mail for this domain and sign outgoing messages. Mail hostname: {hostname}.',
                        { hostname: vm.preview.change.domain?.mxHost || '' },
                      )}
                    </p>
                    <p>
                      {t(
                        'After saving, publish the DNS records at your domain provider and check delivery.',
                      )}
                    </p>
                  </>
                )}
                {vm.preview.change.kind === 'forwarding' && (
                  <>
                    <strong>
                      {vm.preview.change.destination
                        ? t('Forward incoming mail')
                        : t('Remove forwarding')}
                    </strong>
                    <p>
                      {vm.preview.change.source}
                      {vm.preview.change.destination
                        ? ` → ${vm.preview.change.destination}`
                        : ''}
                    </p>
                    {vm.preview.change.destination && (
                      <p>
                        {vm.preview.change.keepCopy
                          ? t('A copy will stay in the original mailbox.')
                          : t(
                              'Incoming messages will only go to the forwarding destination.',
                            )}
                      </p>
                    )}
                  </>
                )}
                {vm.preview.change.kind === 'filters' && (
                  <>
                    <strong>
                      {t(
                        vm.preview.change.enabled
                          ? 'Enable mailbox sorting rules'
                          : 'Disable mailbox sorting rules',
                      )}
                    </strong>
                    <p>
                      {vm.preview.change.enabled
                        ? t(
                            'Rules saved by your users will run when incoming mail is delivered.',
                          )
                        : t(
                            'Incoming messages will use the default delivery folder.',
                          )}
                    </p>
                  </>
                )}
              </div>
              <details className="configuration-diff">
                <summary>{t('View configuration changes')}</summary>
                <pre>{vm.preview.diff || t('No changes')}</pre>
              </details>
              <div className="actions">
                <button
                  className="primary"
                  type="button"
                  disabled={vm.busy || !vm.preview.diff}
                  onClick={vm.apply}
                >
                  {vm.busy ? t('Saving…') : t('Save changes')}
                </button>
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={() => vm.setPreview(null)}
                >
                  {t('Cancel')}
                </button>
              </div>
            </section>
          )}
          {vm.tab === 'activity' && (
            <section className="activity">
              <h3>{t('Find out what happened to a message')}</h3>
              <p>
                {t(
                  'Paste the message ID from a delivery failure, such as f733b3cc. This searches the latest 300 server log entries.',
                )}
              </p>
              <form
                className="activity-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  vm.loadActivity()
                }}
              >
                <label>
                  {t('Message ID (optional)')}
                  <input
                    value={vm.messageId}
                    onChange={(event) => vm.setMessageId(event.target.value)}
                    placeholder={t('Message ID from the delivery notice')}
                  />
                </label>
                <button type="submit" disabled={vm.busy}>
                  {t('Search activity')}
                </button>
              </form>
              {vm.activity && (
                <div className="activity-list">
                  {vm.activity.length === 0 && (
                    <p>
                      {t(
                        'No matching entries in the recent log. The message may be older than this window.',
                      )}
                    </p>
                  )}
                  {vm.activity.map((entry, index) => (
                    <article key={index}>
                      <time>
                        {entry.timestamp
                          ? dateTime(Number(entry.timestamp) / 1000)
                          : ''}
                      </time>
                      <pre>{entry.message}</pre>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
          {vm.tab === 'diagnostics' && (
            <section className="diagnostics">
              <h3>{t('Delivery tests')}</h3>
              <details className="worker-setup">
                <summary>{t('Scheduled sending and reminders')}</summary>
                <p>
                  {vm.state.lastWorkerRun
                    ? t('Last background check: {0}', {
                        '0': dateTime(vm.state.lastWorkerRun),
                      })
                    : t('No background check has been recorded yet.')}
                </p>
                <p>
                  {t(
                    'These features need the background worker. On the server, install its timer using the app user and the absolute project directory.',
                  )}
                </p>
                <pre>
                  sudo sh scripts/install-mail-worker.sh APP_USER /path/to/jmail
                </pre>
                <p>
                  {t(
                    'Set CRON_SECRET in the app environment. For a custom local port, set JMAIL_WORKER_ORIGIN to the local app address. The timer checks work every minute.',
                  )}
                </p>
              </details>
              <p>
                {t(
                  'DNS checks compare published records. Send and forwarding tests send a real message to the address you choose. Receiving is confirmed by finding its tracking token in a mailbox.',
                )}
              </p>
              <form className="test-form" onSubmit={vm.runTest}>
                <fieldset disabled={vm.busy}>
                  <label>
                    {t('Test')}
                    <select
                      aria-label={t('Test')}
                      value={vm.test.mode}
                      onChange={(e) =>
                        vm.setTest((t) => ({ ...t, mode: e.target.value }))
                      }
                    >
                      <option value="dns">
                        {t('DNS and email authentication')}
                      </option>
                      <option value="send">{t('Send a test email')}</option>
                      <option value="receive">
                        {t('Receive / check mailbox')}
                      </option>
                      <option value="forward">
                        {t('Send through a forwarding rule')}
                      </option>
                    </select>
                  </label>
                  {vm.test.mode === 'dns' ? (
                    <label>
                      {t('Domain')}
                      <select
                        aria-label={t('Diagnostic domain')}
                        value={vm.test.domain}
                        onChange={(e) =>
                          vm.setTest((t) => ({ ...t, domain: e.target.value }))
                        }
                      >
                        {vm.state.domains.map((domain) => (
                          <option key={domain.name}>{domain.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <>
                      <label>
                        {vm.test.mode === 'receive'
                          ? t('Mailbox to check')
                          : t('Send from')}
                        <input
                          type="email"
                          required
                          value={vm.test.email}
                          onChange={(e) =>
                            vm.setTest((t) => ({
                              ...t,
                              email: e.target.value,
                              password: '',
                            }))
                          }
                        />
                      </label>
                      <label>
                        {t('Mailbox password')}
                        <input
                          type="password"
                          autoComplete="off"
                          required={vm.test.email !== adminEmail}
                          value={vm.test.password}
                          placeholder={
                            vm.test.email === adminEmail
                              ? t('Uses your current session if blank')
                              : t('Required for another mailbox')
                          }
                          onChange={(e) =>
                            vm.setTest((t) => ({
                              ...t,
                              password: e.target.value,
                            }))
                          }
                        />
                      </label>
                      {vm.test.mode !== 'receive' && (
                        <label>
                          {vm.test.mode === 'forward'
                            ? t('Mailbox with a forwarding rule')
                            : t('Send test to')}
                          <input
                            type="email"
                            required
                            value={vm.test.recipient}
                            onChange={(e) =>
                              vm.setTest((t) => ({
                                ...t,
                                recipient: e.target.value,
                              }))
                            }
                          />
                        </label>
                      )}
                      {vm.test.mode === 'receive' && (
                        <label>
                          {t('Tracking token (optional)')}
                          <input
                            value={vm.test.token}
                            onChange={(e) =>
                              vm.setTest((t) => ({
                                ...t,
                                token: e.target.value,
                              }))
                            }
                            placeholder={t('jmail-test-…')}
                          />
                        </label>
                      )}
                    </>
                  )}
                </fieldset>
                {vm.test.mode === 'receive' && (
                  <div className="inbound-help">
                    <p>
                      {t(
                        'To test public inbound delivery, generate a token, send an email with that token as the subject from an external provider to this mailbox, then run the check. For forwarding, check the destination inbox for the token from the forwarding test.',
                      )}
                    </p>
                    <button
                      type="button"
                      disabled={vm.busy}
                      onClick={vm.generateToken}
                    >
                      {t('Generate inbound test token')}
                    </button>
                  </div>
                )}
                <button className="primary" type="submit" disabled={vm.busy}>
                  {vm.busy
                    ? t('Working…')
                    : vm.test.mode === 'send' || vm.test.mode === 'forward'
                      ? t('Send test email')
                      : t('Run checks')}
                </button>
              </form>
              <div className="test-history">
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={vm.loadHistory}
                >
                  {t('Load previous tests')}
                </button>
                {vm.history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => vm.setResult(item.result)}
                  >
                    {item.target} · {t(item.mode)} · {dateTime(item.at)}
                  </button>
                ))}
              </div>
              {vm.result && (
                <div className="results" aria-live="polite">
                  {vm.result.token && (
                    <p className="token">
                      {t('Tracking token:')} <code>{vm.result.token}</code>
                    </p>
                  )}
                  {vm.result.checks.map((check, index) => (
                    <article
                      className={`check ${check.status}`}
                      key={`${t(check.name)}-${index}`}
                    >
                      <h4>
                        {t(check.name)} ·{' '}
                        {check.status === 'pass'
                          ? t('Passed')
                          : check.status === 'fail'
                            ? t('Failed')
                            : t('Needs review')}
                      </h4>
                      <p>{t(check.detail)}</p>
                      {check.expected && (
                        <>
                          <pre>{t(check.expected)}</pre>
                          <button
                            type="button"
                            onClick={() => vm.copyRecord(check.expected!)}
                          >
                            {t('Copy record')}
                          </button>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default MailServerAdmin
