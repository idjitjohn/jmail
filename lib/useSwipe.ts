'use client'

import { useRef, useState, useEffect } from 'react'

interface Options {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number        // min px to commit, default 80
  velocityThreshold?: number // px/ms to commit even if short, default 0.4
  disabled?: boolean
}

// Panel navigation swipe hook.
// Attach ref to container; during drag, dragX is the live offset.
// Uses passive:false on touchmove to allow preventDefault (no native scroll conflict).
export function useSwipe<T extends HTMLElement = HTMLDivElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  velocityThreshold = 0.4,
  disabled = false,
}: Options = {}) {
  const ref = useRef<T>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const startTime = useRef(0)
  const currentX = useRef(0)
  const dirLocked = useRef<'h' | 'v' | null>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)

  // Keep callbacks in refs so the effect doesn't re-register on every render
  const leftRef = useRef(onSwipeLeft)
  const rightRef = useRef(onSwipeRight)
  useEffect(() => { leftRef.current = onSwipeLeft }, [onSwipeLeft])
  useEffect(() => { rightRef.current = onSwipeRight }, [onSwipeRight])

  useEffect(() => {
    const el = ref.current
    if (!el || disabled) return

    const onStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      startTime.current = Date.now()
      currentX.current = 0
      dirLocked.current = null
      setDragging(true)
      setDragX(0)
    }

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      if (!dirLocked.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        dirLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      }

      if (dirLocked.current !== 'h') return
      e.preventDefault()
      currentX.current = dx
      setDragX(dx)
    }

    const onEnd = () => {
      setDragging(false)
      const dx = currentX.current
      const elapsed = Math.max(Date.now() - startTime.current, 1)
      const velocity = Math.abs(dx) / elapsed
      const committed = Math.abs(dx) > threshold || velocity > velocityThreshold

      if (committed) {
        if (dx > 0) rightRef.current?.()
        else if (dx < 0) leftRef.current?.()
      }
      currentX.current = 0
      setDragX(0)
    }

    const onCancel = () => {
      setDragging(false)
      currentX.current = 0
      setDragX(0)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onCancel, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onCancel)
    }
  }, [disabled, threshold, velocityThreshold])

  return { ref, dragX, dragging }
}
