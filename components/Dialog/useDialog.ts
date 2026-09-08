'use client'
import { useEffect, useRef, useId } from 'react'
export const useDialog = (onClose: () => void, busy: boolean) => {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return {
    ref,
    id,
    cancel: (event: React.SyntheticEvent) => {
      event.preventDefault()
      if (!busy) closeRef.current()
    },
  }
}
