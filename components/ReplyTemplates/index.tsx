'use client'

import { useReplyTemplates } from './useReplyTemplates'
import './ReplyTemplates.scss'

type Props = { onInsert: (body: string) => void; onClose: () => void }

const ReplyTemplates = ({ onInsert, onClose }: Props) => {
  const {
    filtered,
    query,
    setQuery,
    creating,
    setCreating,
    name,
    setName,
    body,
    setBody,
    error,
    loading,
    busy,
    deleting,
    setDeleting,
    save,
    remove,
    retry,
  } = useReplyTemplates()

  return (
    <section className="ReplyTemplates" aria-label="Reply templates">
      <div className="heading">
        <div className="intro">
          <h3>A few words, ready to go</h3>
          <p>Insert a reply, then make it yours.</p>
        </div>
        <button
          type="button"
          className="close"
          aria-label="Close templates"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}{' '}
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      )}
      {creating ? (
        <div className="create-form">
          <label className="field">
            Template name
            <input
              autoFocus
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project handoff"
            />
          </label>
          <label className="field">
            Your reply
            <textarea
              rows={4}
              maxLength={10000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write something you often say…"
            />
          </label>
          <div className="actions">
            <button
              type="button"
              onClick={() => setCreating(false)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="primary"
              type="button"
              onClick={save}
              disabled={busy || !name.trim() || !body.trim()}
            >
              {busy ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="tools">
            <input
              type="search"
              aria-label="Find a template"
              placeholder="Find a template…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" onClick={() => setCreating(true)}>
              + Create
            </button>
          </div>
          <div className="templates">
            {loading && <p className="hint">Loading your saved replies…</p>}
            {filtered.map((template) => (
              <div className="template" key={template.id}>
                <button
                  className="insert"
                  type="button"
                  onClick={() => onInsert(template.body)}
                >
                  <strong>{template.name}</strong>
                  <span>{template.body}</span>
                </button>
                {template.custom &&
                  (deleting === template.id ? (
                    <div className="delete-confirm">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => remove(template.id)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDeleting(null)}
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      className="remove"
                      type="button"
                      aria-label={`Delete ${template.name}`}
                      onClick={() => setDeleting(template.id)}
                    >
                      ×
                    </button>
                  ))}
              </div>
            ))}
            {!loading && !filtered.length && (
              <p className="hint">
                No templates match. Create one of your own.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default ReplyTemplates
