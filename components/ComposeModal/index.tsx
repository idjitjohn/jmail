'use client'

import { useEffect } from 'react'
import Input from '../Input'
import Textarea from '../Textarea'
import Button from '../Button'
import { useComposeModal } from './useComposeModal'
import './ComposeModal.scss'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialTo?: string
  initialSubject?: string
  initialBody?: string
  inReplyTo?: string
}

export default function ComposeModal({
  isOpen,
  onClose,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  inReplyTo,
}: Props) {
  const {
    to, setTo,
    cc, setCc,
    subject, setSubject,
    body, setBody,
    showCc, setShowCc,
    sending, error,
    handleSend, init,
  } = useComposeModal(onClose)

  useEffect(() => {
    if (isOpen) {
      init({ to: initialTo, subject: initialSubject, body: initialBody, inReplyTo })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="ComposeModal" role="dialog" aria-modal="true">
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <div className="panel-header">
          <h2 className="title">New Message</h2>
          <button className="close-btn" onClick={onClose} type="button" aria-label="Close">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
            </svg>
          </button>
        </div>

        <div className="fields">
          <div className="field-row">
            <Input
              label="To"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={e => setTo(e.target.value)}
              autoFocus
            />
            {!showCc && (
              <button
                className="cc-toggle"
                onClick={() => setShowCc(true)}
                type="button"
              >
                Cc
              </button>
            )}
          </div>

          {showCc && (
            <Input
              label="Cc"
              type="text"
              placeholder="cc@example.com"
              value={cc}
              onChange={e => setCc(e.target.value)}
            />
          )}

          <Input
            label="Subject"
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />

          <Textarea
            label="Message"
            placeholder="Write your message..."
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={10}
          />
        </div>

        {error && <p className="send-error">{error}</p>}

        <div className="panel-footer">
          <Button variant="secondary" onClick={onClose}>Discard</Button>
          <Button onClick={handleSend} loading={sending}>Send</Button>
        </div>
      </div>
    </div>
  )
}
