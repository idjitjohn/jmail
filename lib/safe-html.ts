'use client'

import DOMPurify from 'dompurify'

export const safeHtml = (value: string) =>
  typeof window === 'undefined'
    ? ''
    : DOMPurify.sanitize(value, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: [
          'style',
          'form',
          'input',
          'button',
          'textarea',
          'select',
          'iframe',
        ],
        FORBID_ATTR: ['srcset'],
        ADD_ATTR: ['target'],
      })
