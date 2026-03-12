import clsx from 'clsx'
import Badge from '../Badge'
import { FOLDER_LABELS } from '@/lib/types'
import type { MailFolder } from '@/lib/types'
import './FolderItem.scss'

interface Props {
  folder: MailFolder
  isActive: boolean
  onClick: (path: string) => void
}

export default function FolderItem({ folder, isActive, onClick }: Props) {
  const label = FOLDER_LABELS[folder.path] || FOLDER_LABELS[folder.name] || folder.name
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
