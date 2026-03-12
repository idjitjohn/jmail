export interface TemplateField {
  key: string
  label: string
  placeholder: string
  type?: 'text' | 'email' | 'url' | 'color' | 'tel'
  optional?: boolean
  group?: 'identity' | 'contact' | 'social' | 'style'
}

export interface SignatureTemplate {
  id: string
  name: string
  fields: TemplateField[]
  defaultColor?: string
  build: (f: Record<string, string>) => string
}

// Replace {{key}} — empty string if missing
function r(tpl: string, f: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => f[k] ?? '')
}

// Only render a block if at least one of the keys has a value
function when(f: Record<string, string>, keys: string[], html: string): string {
  return keys.some(k => f[k]?.trim()) ? r(html, f) : ''
}

const SOCIAL_ICON = {
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-3a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
} as const

type SocialKey = keyof typeof SOCIAL_ICON

function buildSocialLinks(f: Record<string, string>, color: string): string {
  const socials: { key: SocialKey; label: string; baseUrl: string }[] = [
    { key: 'linkedin', label: 'LinkedIn', baseUrl: 'https://linkedin.com/in/' },
    { key: 'twitter', label: 'X / Twitter', baseUrl: 'https://x.com/' },
    { key: 'github', label: 'GitHub', baseUrl: 'https://github.com/' },
    { key: 'instagram', label: 'Instagram', baseUrl: 'https://instagram.com/' },
    { key: 'facebook', label: 'Facebook', baseUrl: 'https://facebook.com/' },
    { key: 'tiktok', label: 'TikTok', baseUrl: 'https://tiktok.com/@' },
    { key: 'youtube', label: 'YouTube', baseUrl: 'https://youtube.com/' },
  ]

  const active = socials.filter(s => f[s.key]?.trim())
  if (!active.length) return ''

  const links = active.map(({ key, label, baseUrl }) => {
    const val = f[key]
    const href = val.startsWith('http') ? val : `${baseUrl}${val}`
    return `<a href="${href}" title="${label}" style="display:inline-flex;align-items:center;color:${color};text-decoration:none;margin-right:8px">${SOCIAL_ICON[key]}</a>`
  }).join('')

  return `<p style="margin:6px 0 0">${links}</p>`
}

export const TEMPLATES: SignatureTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    defaultColor: '#007aff',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe', group: 'identity' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer', optional: true, group: 'identity' },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email', group: 'contact' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', type: 'tel', optional: true, group: 'contact' },
    ],
    build: f => `<p style="margin:0;font-family:-apple-system,sans-serif;font-size:13px;color:#333;line-height:1.5">
  <strong style="color:#1c1c1e">${f.name || 'Your Name'}</strong>${f.title ? ` &nbsp;·&nbsp; <span style="color:#8e8e93">${f.title}</span>` : ''}
  <br><a href="mailto:${f.email}" style="color:#007aff;text-decoration:none">${f.email || 'your@email.com'}</a>${f.phone ? ` &nbsp;·&nbsp; <span style="color:#8e8e93">${f.phone}</span>` : ''}
</p>`,
  },

  {
    id: 'simple',
    name: 'Simple',
    defaultColor: '#007aff',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe', group: 'identity' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer', optional: true, group: 'identity' },
      { key: 'company', label: 'Company', placeholder: 'Acme Corp', optional: true, group: 'identity' },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email', group: 'contact' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', type: 'tel', optional: true, group: 'contact' },
      { key: 'website', label: 'Website', placeholder: 'https://example.com', type: 'url', optional: true, group: 'contact' },
      { key: 'linkedin', label: 'LinkedIn', placeholder: 'username', optional: true, group: 'social' },
      { key: 'twitter', label: 'X / Twitter', placeholder: 'username', optional: true, group: 'social' },
      { key: 'github', label: 'GitHub', placeholder: 'username', optional: true, group: 'social' },
      { key: 'instagram', label: 'Instagram', placeholder: 'username', optional: true, group: 'social' },
      { key: 'color', label: 'Link color', placeholder: '#007aff', type: 'color', group: 'style' },
    ],
    build: f => {
      const color = f.color || '#007aff'
      return `<div style="font-family:-apple-system,sans-serif;font-size:13px;line-height:1.5;color:#333">
  <p style="margin:0 0 3px"><strong style="font-size:14px;color:#1c1c1e">${f.name || 'Your Name'}</strong>${f.title ? `<br><span style="color:#8e8e93">${f.title}${f.company ? ` · ${f.company}` : ''}</span>` : (f.company ? `<br><span style="color:#8e8e93">${f.company}</span>` : '')}</p>
  <p style="margin:0"><a href="mailto:${f.email}" style="color:${color};text-decoration:none">${f.email || 'your@email.com'}</a>${f.phone ? `<br><span style="color:#8e8e93">${f.phone}</span>` : ''}${f.website ? `<br><a href="${f.website}" style="color:${color};text-decoration:none">${f.website}</a>` : ''}</p>
  ${buildSocialLinks(f, color)}
</div>`
    },
  },

  {
    id: 'professional',
    name: 'Professional',
    defaultColor: '#007aff',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe', group: 'identity' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer', group: 'identity' },
      { key: 'company', label: 'Company', placeholder: 'Acme Corp', optional: true, group: 'identity' },
      { key: 'address', label: 'Address', placeholder: 'Paris, France', optional: true, group: 'identity' },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email', group: 'contact' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', type: 'tel', optional: true, group: 'contact' },
      { key: 'mobile', label: 'Mobile', placeholder: '+1 234 567 890', type: 'tel', optional: true, group: 'contact' },
      { key: 'website', label: 'Website', placeholder: 'https://example.com', type: 'url', optional: true, group: 'contact' },
      { key: 'linkedin', label: 'LinkedIn', placeholder: 'username', optional: true, group: 'social' },
      { key: 'twitter', label: 'X / Twitter', placeholder: 'username', optional: true, group: 'social' },
      { key: 'github', label: 'GitHub', placeholder: 'username', optional: true, group: 'social' },
      { key: 'instagram', label: 'Instagram', placeholder: 'username', optional: true, group: 'social' },
      { key: 'facebook', label: 'Facebook', placeholder: 'username', optional: true, group: 'social' },
      { key: 'youtube', label: 'YouTube', placeholder: 'channel URL or username', optional: true, group: 'social' },
      { key: 'color', label: 'Accent color', placeholder: '#007aff', type: 'color', group: 'style' },
    ],
    build: f => {
      const color = f.color || '#007aff'
      return `<table style="border-collapse:collapse;font-family:-apple-system,sans-serif;font-size:13px">
  <tr>
    <td style="padding-right:14px;border-right:2px solid ${color};vertical-align:top">
      <p style="margin:0;font-weight:700;font-size:14px;color:#1c1c1e">${f.name || 'Your Name'}</p>
      <p style="margin:2px 0 0;color:#8e8e93">${f.title || 'Job Title'}${f.company ? ` · ${f.company}` : ''}</p>
      ${f.address ? `<p style="margin:2px 0 0;color:#aeaeb2;font-size:12px">${f.address}</p>` : ''}
    </td>
    <td style="padding-left:14px;vertical-align:top">
      <p style="margin:0"><a href="mailto:${f.email}" style="color:${color};text-decoration:none">${f.email || 'your@email.com'}</a></p>
      ${f.phone ? `<p style="margin:2px 0 0;color:#8e8e93">📞 ${f.phone}</p>` : ''}
      ${f.mobile ? `<p style="margin:2px 0 0;color:#8e8e93">📱 ${f.mobile}</p>` : ''}
      ${f.website ? `<p style="margin:2px 0 0"><a href="${f.website}" style="color:${color};text-decoration:none">${f.website}</a></p>` : ''}
      ${buildSocialLinks(f, color)}
    </td>
  </tr>
</table>`
    },
  },

  {
    id: 'modern',
    name: 'Modern',
    defaultColor: '#007aff',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe', group: 'identity' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer', group: 'identity' },
      { key: 'company', label: 'Company', placeholder: 'Acme Corp', optional: true, group: 'identity' },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email', group: 'contact' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', type: 'tel', optional: true, group: 'contact' },
      { key: 'mobile', label: 'Mobile', placeholder: '+1 234 567 890', type: 'tel', optional: true, group: 'contact' },
      { key: 'website', label: 'Website', placeholder: 'https://example.com', type: 'url', optional: true, group: 'contact' },
      { key: 'linkedin', label: 'LinkedIn', placeholder: 'username', optional: true, group: 'social' },
      { key: 'twitter', label: 'X / Twitter', placeholder: 'username', optional: true, group: 'social' },
      { key: 'github', label: 'GitHub', placeholder: 'username', optional: true, group: 'social' },
      { key: 'instagram', label: 'Instagram', placeholder: 'username', optional: true, group: 'social' },
      { key: 'tiktok', label: 'TikTok', placeholder: 'username', optional: true, group: 'social' },
      { key: 'youtube', label: 'YouTube', placeholder: 'channel URL or username', optional: true, group: 'social' },
      { key: 'color', label: 'Accent color', placeholder: '#007aff', type: 'color', group: 'style' },
    ],
    build: f => {
      const color = f.color || '#007aff'
      return `<div style="font-family:-apple-system,sans-serif;font-size:13px;padding-left:12px;border-left:3px solid ${color}">
  <p style="margin:0;font-size:15px;font-weight:700;color:#1c1c1e">${f.name || 'Your Name'}</p>
  <p style="margin:2px 0 8px;color:#8e8e93">${f.title || 'Job Title'}${f.company ? ` · ${f.company}` : ''}</p>
  <p style="margin:0"><a href="mailto:${f.email}" style="color:${color};text-decoration:none">${f.email || 'your@email.com'}</a>${f.phone ? `&nbsp; · &nbsp;<span style="color:#8e8e93">${f.phone}</span>` : ''}</p>
  ${f.mobile ? `<p style="margin:2px 0 0;color:#8e8e93">📱 ${f.mobile}</p>` : ''}
  ${f.website ? `<p style="margin:3px 0 0"><a href="${f.website}" style="color:${color};text-decoration:none">${f.website}</a></p>` : ''}
  ${buildSocialLinks(f, color)}
</div>`
    },
  },

  {
    id: 'card',
    name: 'Card',
    defaultColor: '#007aff',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe', group: 'identity' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer', group: 'identity' },
      { key: 'company', label: 'Company', placeholder: 'Acme Corp', optional: true, group: 'identity' },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email', group: 'contact' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', type: 'tel', optional: true, group: 'contact' },
      { key: 'website', label: 'Website', placeholder: 'https://example.com', type: 'url', optional: true, group: 'contact' },
      { key: 'linkedin', label: 'LinkedIn', placeholder: 'username', optional: true, group: 'social' },
      { key: 'twitter', label: 'X / Twitter', placeholder: 'username', optional: true, group: 'social' },
      { key: 'github', label: 'GitHub', placeholder: 'username', optional: true, group: 'social' },
      { key: 'instagram', label: 'Instagram', placeholder: 'username', optional: true, group: 'social' },
      { key: 'facebook', label: 'Facebook', placeholder: 'username', optional: true, group: 'social' },
      { key: 'color', label: 'Accent color', placeholder: '#007aff', type: 'color', group: 'style' },
    ],
    build: f => {
      const color = f.color || '#007aff'
      return `<div style="display:inline-block;font-family:-apple-system,sans-serif;padding:12px 16px;border:1px solid #e5e5ea;border-top:3px solid ${color};border-radius:8px;font-size:13px;min-width:200px">
  <p style="margin:0;font-weight:700;font-size:14px;color:#1c1c1e">${f.name || 'Your Name'}</p>
  <p style="margin:2px 0 10px;color:#8e8e93;font-size:12px">${f.title || 'Job Title'}${f.company ? ` · ${f.company}` : ''}</p>
  <p style="margin:0"><a href="mailto:${f.email}" style="color:${color};text-decoration:none">${f.email || 'your@email.com'}</a></p>
  ${f.phone ? `<p style="margin:3px 0 0;color:#8e8e93">${f.phone}</p>` : ''}
  ${f.website ? `<p style="margin:3px 0 0"><a href="${f.website}" style="color:${color};text-decoration:none">${f.website}</a></p>` : ''}
  ${buildSocialLinks(f, color)}
</div>`
    },
  },
]
