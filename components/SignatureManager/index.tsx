'use client'

import SignatureEditor from '../SignatureEditor'
import Button from '../Button'
import { useSignatureManager } from './useSignatureManager'
import './SignatureManager.scss'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SignatureManager({ isOpen, onClose }: Props) {
  const { signatures, editing, isCreating, startCreate, startEdit, cancelEditor, save, remove } =
    useSignatureManager()

  if (!isOpen) return null

  return (
    <div className="SignatureManager" role="dialog" aria-modal="true">
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <div className="panel-header">
          <h2 className="title">Signatures</h2>
          <button className="close-btn" onClick={onClose} type="button" aria-label="Close" />
        </div>

        <div className="panel-body">
          {isCreating ? (
            <SignatureEditor
              initial={editing}
              onSave={save}
              onCancel={cancelEditor}
            />
          ) : (
            <>
              {signatures.length === 0 ? (
                <div className="empty">
                  <p>No signatures yet.</p>
                </div>
              ) : (
                <div className="sig-list">
                  {signatures.map(sig => (
                    <div key={sig.id} className="sig-item">
                      <div className="sig-info">
                        <p className="sig-name">{sig.name}</p>
                        <div
                          className="sig-preview"
                          dangerouslySetInnerHTML={{ __html: sig.html }}
                        />
                      </div>
                      <div className="sig-actions">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(sig)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(sig.id)}
                          className="remove-btn"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="secondary" size="sm" onClick={startCreate} className="new-sig-btn">
                New signature
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
