'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'

import SignatureEditor from '../SignatureEditor'
import Button from '../Button'
import { useSignatureManager } from './useSignatureManager'
import './SignatureManager.scss'

type Props = {
  userEmail: string
  isOpen: boolean
  onClose: () => void
}

const SignatureManager = ({ isOpen, onClose, userEmail }: Props) => {
  const { t } = useLocale()

  const {
    signatures,
    hasLegacy,
    importLegacy,
    editing,
    isCreating,
    startCreate,
    startEdit,
    cancelEditor,
    save,
    remove,
  } = useSignatureManager(userEmail)

  if (!isOpen) return null

  return (
    <div className="SignatureManager" role="dialog" aria-modal="true">
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <div className="panel-header">
          <h2 className="title">{t('Signatures')}</h2>
          <button
            className="close-btn"
            onClick={onClose}
            type="button"
            aria-label={t('Close')}
          />
        </div>

        <div className="panel-body">
          {hasLegacy && (
            <Button variant="secondary" size="sm" onClick={importLegacy}>
              {t('Import older signatures from this browser')}
            </Button>
          )}
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
                  <p>{t('No signatures yet.')}</p>
                </div>
              ) : (
                <div className="sig-list">
                  {signatures.map((sig) => (
                    <div key={sig.id} className="sig-item">
                      <div className="sig-info">
                        <p className="sig-name">{sig.name}</p>
                        <div
                          className="sig-preview"
                          dangerouslySetInnerHTML={{ __html: sig.html }}
                        />
                      </div>
                      <div className="sig-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(sig)}
                        >
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(sig.id)}
                          className="remove-btn"
                        >
                          {t('Remove')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={startCreate}
                className="new-sig-btn"
              >
                {t('New signature')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SignatureManager
