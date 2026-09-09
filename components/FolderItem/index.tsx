'use client'

import clsx from 'clsx'
import Badge from '../Badge'
import { folderLabel } from '@/lib/i18n/folders'
import { useLocale } from '../LocaleProvider/useLocale'
import type { MailFolder } from '@/lib/types'
import './FolderItem.scss'

interface Props {
  folder: MailFolder
  isActive: boolean
  onClick: (path: string) => void
}

export default function FolderItem({ folder, isActive, onClick }: Props) {
  const { locale } = useLocale()
  const label = folderLabel(folder, locale)
  const folderKey = folder.path || folder.name

  return (
    <button
      className={clsx('FolderItem', { active: isActive })}
      onClick={() => onClick(folder.path)}
      data-folder={folderKey}
      type="button"
    >
      <span className="icon" />
      <span className="name">{label}</span>
      {folder.unread > 0 && <Badge count={folder.unread} />}
    </button>
  )
}
