'use client'
import Dialog from '../Dialog'
import { useAttachmentPreview } from './useAttachmentPreview'
import type { PreviewFile } from './types'
import './AttachmentPreview.scss'

type Props = { file: PreviewFile; onClose: () => void }
const AttachmentPreview = ({ file, onClose }: Props) => {
  const vm = useAttachmentPreview(file)
  return (
    <Dialog title={file.filename} onClose={onClose}>
      <div className="AttachmentPreview">
        {vm.error && <p role="alert">{vm.error}</p>}
        {vm.mode === 'download' ? (
          <p>Download this file to open it in a compatible app.</p>
        ) : vm.mode === 'text' ? (
          <pre>{vm.text || 'Loading preview…'}</pre>
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
          !vm.error && <p role="status">Loading preview…</p>
        )}
        <a href={vm.downloadUrl} download={file.filename}>
          Download {file.filename}
        </a>
      </div>
    </Dialog>
  )
}
export default AttachmentPreview
