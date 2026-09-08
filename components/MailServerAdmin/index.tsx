'use client'

import { useMailServerAdmin } from './useMailServerAdmin'
import './MailServerAdmin.scss'

type Props = { adminEmail: string }

const MailServerAdmin = ({ adminEmail }: Props) => {
  const { previewRef, formRef, ...vm } = useMailServerAdmin(adminEmail)

  return (
    <div className="MailServerAdmin">
      <div className="intro">
        <div className="heading">
          <h2>Mail server</h2>
          <p>Manage domains, forwarding, and delivery from one place.</p>
        </div>
        <button
          type="button"
          disabled={vm.busy || vm.loading}
          onClick={vm.refresh}
        >
          Refresh server
        </button>
      </div>
      {vm.error && (
        <p className="error" role="alert">
          {vm.error}
        </p>
      )}
      {vm.notice && (
        <p className="notice" role="status">
          {vm.notice}
        </p>
      )}
      {vm.loading && (
        <p className="loading" role="status">
          Connecting to Maddy…
        </p>
      )}
      {!vm.loading && !vm.state && (
        <section className="setup">
          <h3>Connect server administration</h3>
          <p>
            On the Linux server running JMail and Maddy, run this from the JMail
            project directory. Replace APP_USER with the Linux user running
            JMail.
          </p>
          <pre>sudo sh scripts/install-maddy-admin.sh APP_USER</pre>
          <p>
            The helper supports /etc/maddy/maddy.conf, /usr/local/bin/maddy, and
            the maddy systemd service. Existing custom routing is preserved;
            unsupported layouts return an explanation before any change.
          </p>
        </section>
      )}
      {vm.state && (
        <>
          <p className={vm.state.active ? 'notice' : 'error'}>
            Maddy is {vm.state.active ? 'running' : 'not running'}. Primary
            domain: {vm.state.primaryDomain}
          </p>
          <nav className="server-tabs" aria-label="Server sections">
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
                  ? 'Domains'
                  : tab === 'forwarding'
                    ? 'Routing & rules'
                    : tab === 'activity'
                      ? 'Server activity'
                      : 'Delivery tests'}
              </button>
            ))}
          </nav>
          {vm.tab === 'domains' && (
            <section className="domains">
              <div className="section-heading">
                <h3>Your email domains</h3>
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={() => vm.editDomain()}
                >
                  Add domain
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
                        ? 'DKIM key available'
                        : 'DKIM key needs checking'}
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
                  <h4>{vm.original ? `Edit ${vm.original}` : 'New domain'}</h4>
                  <p>
                    1. Enter the domain details. 2. Review and save. 3. Publish
                    the DNS records and check delivery.
                  </p>
                  <fieldset disabled={vm.busy}>
                    <label>
                      Domain
                      <input
                        required
                        value={vm.domain.name}
                        placeholder="example.org"
                        onChange={(e) =>
                          vm.updateDomain(
                            'name',
                            e.target.value.toLowerCase().trim(),
                          )
                        }
                      />
                    </label>
                    <label>
                      Public mail hostname
                      <input
                        required
                        value={vm.domain.mxHost}
                        placeholder="smtp.example.org"
                        onChange={(e) =>
                          vm.updateDomain(
                            'mxHost',
                            e.target.value.toLowerCase().trim(),
                          )
                        }
                      />
                    </label>
                    <label>
                      Sending IPv4
                      <input
                        value={vm.domain.ipv4}
                        placeholder="Server’s outgoing IPv4"
                        onChange={(e) =>
                          vm.updateDomain('ipv4', e.target.value.trim())
                        }
                      />
                    </label>
                    <label>
                      Sending IPv6
                      <input
                        value={vm.domain.ipv6}
                        placeholder="Server’s outgoing IPv6, if enabled"
                        onChange={(e) =>
                          vm.updateDomain('ipv6', e.target.value.trim())
                        }
                      />
                    </label>
                    <label>
                      DKIM selector
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
                    Review changes
                  </button>
                  <button
                    type="button"
                    disabled={vm.busy}
                    onClick={() => {
                      vm.setEditingDomain(false)
                      vm.setPreview(null)
                    }}
                  >
                    Cancel
                  </button>
                  {vm.original && (
                    <button
                      type="button"
                      disabled={vm.busy}
                      onClick={() => vm.checkDomain(vm.original)}
                    >
                      Check this domain’s DNS
                    </button>
                  )}
                </form>
              )}
              {!vm.editingDomain && (
                <p>
                  Select a domain to update it, or add a domain for new email
                  addresses.
                </p>
              )}
            </section>
          )}
          {vm.tab === 'forwarding' && (
            <section className="forwarding">
              <div className="section-heading">
                <h3>Automatic forwarding</h3>
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
                  Add forwarding
                </button>
              </div>
              <p>
                Forward incoming messages using Maddy’s delivery rules. Choose a
                final destination; local forwarding chains are blocked. External
                delivery still depends on the original message’s authentication.
              </p>
              <div className="filter-status">
                <div className="copy">
                  <strong>Mailbox sorting rules</strong>
                  <p>
                    {vm.state.filtersReady
                      ? 'Rules saved by your users run when Maddy receives a message.'
                      : 'Connect users’ sorting rules to incoming delivery.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={vm.toggleFilters}
                >
                  {vm.state.filtersReady
                    ? 'Disable sorting rules'
                    : 'Enable sorting rules'}
                </button>
              </div>
              <div className="rule-list">
                {vm.state.forwarding.length === 0 && (
                  <p>No forwarding rules managed by JMail yet.</p>
                )}
                {vm.state.forwarding.map((rule) => (
                  <div className="rule" key={rule.source}>
                    <span>
                      {rule.source} → {rule.destination}
                      {rule.keepCopy ? ' · Keep a copy' : ''}
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
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={vm.busy}
                      onClick={() => vm.removeForward(rule.source)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {vm.editingForward && (
                <form className="forward-form" onSubmit={vm.previewForward}>
                  <fieldset disabled={vm.busy}>
                    <label>
                      Existing mailbox
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
                      Forward to
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
                      Keep a copy in the original mailbox
                    </label>
                  </fieldset>
                  <button type="submit" disabled={vm.busy}>
                    Review changes
                  </button>
                  <button
                    type="button"
                    disabled={vm.busy}
                    onClick={() => {
                      vm.setEditingForward(false)
                      vm.setPreview(null)
                    }}
                  >
                    Cancel
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
              aria-label="Configuration preview"
            >
              <h3>Review changes</h3>
              <p>
                Maddy will validate the configuration, back up the current
                files, and restart. Active mail connections may briefly
                reconnect. Failed changes restore the previous configuration.
              </p>
              <div className="change-summary">
                {vm.preview.change.kind === 'domain' && (
                  <>
                    <strong>
                      {vm.preview.change.original ? 'Update' : 'Add'}{' '}
                      {vm.preview.change.domain?.name}
                    </strong>
                    <p>
                      Accept mail for this domain and sign outgoing messages.
                      Mail hostname: {vm.preview.change.domain?.mxHost}.
                    </p>
                    <p>
                      After saving, publish the DNS records at your domain
                      provider and check delivery.
                    </p>
                  </>
                )}
                {vm.preview.change.kind === 'forwarding' && (
                  <>
                    <strong>
                      {vm.preview.change.destination
                        ? 'Forward incoming mail'
                        : 'Remove forwarding'}
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
                          ? 'A copy will stay in the original mailbox.'
                          : 'Incoming messages will only go to the forwarding destination.'}
                      </p>
                    )}
                  </>
                )}
                {vm.preview.change.kind === 'filters' && (
                  <>
                    <strong>
                      {vm.preview.change.enabled ? 'Enable' : 'Disable'} mailbox
                      sorting rules
                    </strong>
                    <p>
                      {vm.preview.change.enabled
                        ? 'Rules saved by your users will run when incoming mail is delivered.'
                        : 'Incoming messages will use the default delivery folder.'}
                    </p>
                  </>
                )}
              </div>
              <details className="configuration-diff">
                <summary>View configuration changes</summary>
                <pre>{vm.preview.diff || 'No changes'}</pre>
              </details>
              <div className="actions">
                <button
                  className="primary"
                  type="button"
                  disabled={vm.busy || !vm.preview.diff}
                  onClick={vm.apply}
                >
                  {vm.busy ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={() => vm.setPreview(null)}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}
          {vm.tab === 'activity' && (
            <section className="activity">
              <h3>Find out what happened to a message</h3>
              <p>
                Paste the message ID from a delivery failure, such as f733b3cc.
                This searches the latest 300 server log entries.
              </p>
              <form
                className="activity-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  vm.loadActivity()
                }}
              >
                <label>
                  Message ID (optional)
                  <input
                    value={vm.messageId}
                    onChange={(event) => vm.setMessageId(event.target.value)}
                    placeholder="Message ID from the delivery notice"
                  />
                </label>
                <button type="submit" disabled={vm.busy}>
                  Search activity
                </button>
              </form>
              {vm.activity && (
                <div className="activity-list">
                  {vm.activity.length === 0 && (
                    <p>
                      No matching entries in the recent log. The message may be
                      older than this window.
                    </p>
                  )}
                  {vm.activity.map((entry, index) => (
                    <article key={index}>
                      <time>
                        {entry.timestamp
                          ? new Date(
                              Number(entry.timestamp) / 1000,
                            ).toLocaleString()
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
              <h3>Delivery tests</h3>
              <details className="worker-setup">
                <summary>Scheduled sending and reminders</summary>
                <p>
                  {vm.state.lastWorkerRun
                    ? `Last background check: ${new Date(vm.state.lastWorkerRun).toLocaleString()}`
                    : 'No background check has been recorded yet.'}
                </p>
                <p>
                  These features need the background worker. On the server,
                  install its timer using the app user and the absolute project
                  directory.
                </p>
                <pre>
                  sudo sh scripts/install-mail-worker.sh APP_USER /path/to/jmail
                </pre>
                <p>
                  Set CRON_SECRET in the app environment. For a custom local
                  port, set JMAIL_WORKER_ORIGIN to the local app address. The
                  timer checks work every minute.
                </p>
              </details>
              <p>
                DNS checks compare published records. Send and forwarding tests
                send a real message to the address you choose. Receiving is
                confirmed by finding its tracking token in a mailbox.
              </p>
              <form className="test-form" onSubmit={vm.runTest}>
                <fieldset disabled={vm.busy}>
                  <label>
                    Test
                    <select
                      aria-label="Test"
                      value={vm.test.mode}
                      onChange={(e) =>
                        vm.setTest((t) => ({ ...t, mode: e.target.value }))
                      }
                    >
                      <option value="dns">DNS and email authentication</option>
                      <option value="send">Send a test email</option>
                      <option value="receive">Receive / check mailbox</option>
                      <option value="forward">
                        Send through a forwarding rule
                      </option>
                    </select>
                  </label>
                  {vm.test.mode === 'dns' ? (
                    <label>
                      Domain
                      <select
                        aria-label="Diagnostic domain"
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
                          ? 'Mailbox to check'
                          : 'Send from'}
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
                        Mailbox password
                        <input
                          type="password"
                          autoComplete="off"
                          required={vm.test.email !== adminEmail}
                          value={vm.test.password}
                          placeholder={
                            vm.test.email === adminEmail
                              ? 'Uses your current session if blank'
                              : 'Required for another mailbox'
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
                            ? 'Mailbox with a forwarding rule'
                            : 'Send test to'}
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
                          Tracking token (optional)
                          <input
                            value={vm.test.token}
                            onChange={(e) =>
                              vm.setTest((t) => ({
                                ...t,
                                token: e.target.value,
                              }))
                            }
                            placeholder="jmail-test-…"
                          />
                        </label>
                      )}
                    </>
                  )}
                </fieldset>
                {vm.test.mode === 'receive' && (
                  <div className="inbound-help">
                    <p>
                      To test public inbound delivery, generate a token, send an
                      email with that token as the subject from an external
                      provider to this mailbox, then run the check. For
                      forwarding, check the destination inbox for the token from
                      the forwarding test.
                    </p>
                    <button
                      type="button"
                      disabled={vm.busy}
                      onClick={vm.generateToken}
                    >
                      Generate inbound test token
                    </button>
                  </div>
                )}
                <button className="primary" type="submit" disabled={vm.busy}>
                  {vm.busy
                    ? 'Working…'
                    : vm.test.mode === 'send' || vm.test.mode === 'forward'
                      ? 'Send test email'
                      : 'Run checks'}
                </button>
              </form>
              <div className="test-history">
                <button
                  type="button"
                  disabled={vm.busy}
                  onClick={vm.loadHistory}
                >
                  Load previous tests
                </button>
                {vm.history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => vm.setResult(item.result)}
                  >
                    {item.target} · {item.mode} ·{' '}
                    {new Date(item.at).toLocaleString()}
                  </button>
                ))}
              </div>
              {vm.result && (
                <div className="results" aria-live="polite">
                  {vm.result.token && (
                    <p className="token">
                      Tracking token: <code>{vm.result.token}</code>
                    </p>
                  )}
                  {vm.result.checks.map((check, index) => (
                    <article
                      className={`check ${check.status}`}
                      key={`${check.name}-${index}`}
                    >
                      <h4>
                        {check.name} ·{' '}
                        {check.status === 'pass'
                          ? 'Passed'
                          : check.status === 'fail'
                            ? 'Failed'
                            : 'Needs review'}
                      </h4>
                      <p>{check.detail}</p>
                      {check.expected && (
                        <>
                          <pre>{check.expected}</pre>
                          <button
                            type="button"
                            onClick={() => vm.copyRecord(check.expected!)}
                          >
                            Copy record
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
