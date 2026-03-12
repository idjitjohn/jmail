'use client'

import { createContext, useContext, useReducer, useCallback } from 'react'
import './Toast.scss'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

type Action =
  | { type: 'ADD'; item: ToastItem }
  | { type: 'REMOVE'; id: string }

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  if (action.type === 'ADD') return [...state, action.item]
  return state.filter(t => t.id !== action.id)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    dispatch({ type: 'ADD', item: { id, type, message } })
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="ToastContainer" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="toast-msg">{t.message}</span>
            <button
              className="toast-close"
              onClick={() => dispatch({ type: 'REMOVE', id: t.id })}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
