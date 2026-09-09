'use client'

import { useLocale } from '@/components/LocaleProvider/useLocale'
import Dialog from '../Dialog'
import { useAttachmentPreview } from './useAttachmentPreview'
import type { PreviewFile } from './types'
import './AttachmentPreview.scss'

type Props = { file: PreviewFile; onClose: () => void }
const AttachmentPreview = ({ file, onClose }: Props) => {
  const { t } = useLocale()

  const vm = useAttachmentPreview(file)
  return (
    <Dialog title={file.filename} onClose={onClose}>
      <div className="AttachmentPreview">
        {vm.error && <p role="alert">{t(vm.error)}</p>}
        {vm.mode === 'download' ? (
          <p>{t('Download this file to open it in a compatible app.')}</p>
        ) : vm.mode === 'text' ? (
          <pre>{vm.text || t('Loading preview…')}</pre>
        ) : vm.url ? (
          vm.mode === 'image' ? (
            <div
              className="image"
              role="img"
              aria-label={file.filename}
              style={{ backgroundImage: `url("${vm.url}")` }}
            />
          ) : (
            <iframe title={file.filename} src={vm.url} sandbox="" />
          )
        ) : (
          !vm.error && <p role="status">{t('Loading preview…')}</p>
        )}
        <a href={vm.downloadUrl} download={file.filename}>
          {t('Download {filename}', { filename: file.filename })}
        </a>
      </div>
    </Dialog>
  )
}
export default AttachmentPreview
