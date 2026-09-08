'use client'
import { useEffect, useState } from 'react'
import type { PreviewFile } from './types'

export const useAttachmentPreview = (file: PreviewFile) => {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const downloadUrl = `/api/messages/${file.uid}/attachments/${file.partId}?folder=${encodeURIComponent(file.folder)}`
  const mode = /^image\/(png|jpeg|gif|webp)$/.test(file.contentType)
    ? 'image'
    : file.contentType === 'application/pdf'
      ? 'pdf'
      : /^text\/(plain|csv)$/.test(file.contentType)
        ? 'text'
        : 'download'
  useEffect(() => {
    if (mode === 'download') return
    let cancelled = false
    let objectUrl = ''
    const controller = new AbortController()
    fetch(downloadUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load this attachment.')
        const blob = await response.blob()
        if (cancelled) return
        if (mode === 'text') setText((await blob.text()).slice(0, 200000))
        else {
          objectUrl = URL.createObjectURL(
            new Blob([blob], { type: file.contentType }),
          )
          setUrl(objectUrl)
        }
      })
      .catch((error) => {
        if (!cancelled) setError(error.message)
      })
    return () => {
      cancelled = true
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [downloadUrl, file.contentType, mode])
  return { url, error, text, mode, downloadUrl }
}
