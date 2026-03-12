'use client'

import Input from '../Input'
import Button from '../Button'
import Spinner from '../Spinner'
import { useProfileSettings } from './useProfileSettings'
import './ProfileSettings.scss'

export default function ProfileSettings() {
  const { name, setName, loading, saving, saved, error, save } = useProfileSettings()

  if (loading) {
    return (
      <div className="ProfileSettings">
        <div className="loading"><Spinner size="sm" /></div>
      </div>
    )
  }

  return (
    <div className="ProfileSettings">
      <div className="section-header">
        <h1 className="title">Profile</h1>
        <p className="subtitle">Your display name appears in the From field of outgoing mail</p>
      </div>

      <div className="card">
        <Input
          label="Display name"
          placeholder="John Doe"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="actions">
        {error && <span className="error-msg">{error}</span>}
        {saved && <span className="success-msg">Profile saved</span>}
        <Button onClick={save} loading={saving}>Save</Button>
      </div>
    </div>
  )
}
