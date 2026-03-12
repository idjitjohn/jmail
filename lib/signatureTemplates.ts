export interface TemplateField {
  key: string
  label: string
  placeholder: string
  type?: 'text' | 'email' | 'url' | 'color'
  optional?: boolean
}

export interface SignatureTemplate {
  id: string
  name: string
  html: (fields: Record<string, string>) => string
  fields: TemplateField[]
  defaultColor?: string
}

// Interpolate {{key}} placeholders, skip empty optional lines
function fill(tpl: string, fields: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => fields[k] ?? '')
}

export const TEMPLATES: SignatureTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe' },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
    ],
    html: f => fill(
      `<p style="margin:0;font-family:-apple-system,sans-serif;font-size:13px;color:#333">
  <strong style="color:#1c1c1e">{{name}}</strong> &nbsp;·&nbsp;
  <a href="mailto:{{email}}" style="color:#007aff;text-decoration:none">{{email}}</a>
</p>`,
      f,
    ),
  },
  {
    id: 'simple',
    name: 'Simple',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer', optional: true },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', optional: true },
    ],
    html: f => fill(
      `<div style="font-family:-apple-system,sans-serif;font-size:13px;line-height:1.5;color:#333">
  <p style="margin:0 0 2px"><strong style="font-size:14px;color:#1c1c1e">{{name}}</strong>${f.title ? `<br><span style="color:#8e8e93">{{title}}</span>` : ''}</p>
  <p style="margin:0"><a href="mailto:{{email}}" style="color:#007aff;text-decoration:none">{{email}}</a>${f.phone ? `<br><span style="color:#8e8e93">{{phone}}</span>` : ''}</p>
</div>`,
      f,
    ),
  },
  {
    id: 'professional',
    name: 'Professional',
    defaultColor: '#007aff',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer' },
      { key: 'company', label: 'Company', placeholder: 'Acme Corp', optional: true },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', optional: true },
      { key: 'color', label: 'Accent color', placeholder: '#007aff', type: 'color' },
    ],
    html: f => fill(
      `<table style="border-collapse:collapse;font-family:-apple-system,sans-serif;font-size:13px">
  <tr>
    <td style="padding-right:14px;border-right:2px solid {{color}};vertical-align:top">
      <p style="margin:0;font-weight:700;font-size:14px;color:#1c1c1e">{{name}}</p>
      <p style="margin:2px 0 0;color:#8e8e93">{{title}}</p>
      ${f.company ? `<p style="margin:2px 0 0;font-weight:500;color:#48484a">{{company}}</p>` : ''}
    </td>
    <td style="padding-left:14px;vertical-align:top">
      <p style="margin:0"><a href="mailto:{{email}}" style="color:{{color}};text-decoration:none">{{email}}</a></p>
      ${f.phone ? `<p style="margin:2px 0 0;color:#8e8e93">{{phone}}</p>` : ''}
    </td>
  </tr>
</table>`,
      f,
    ),
  },
  {
    id: 'modern',
    name: 'Modern',
    defaultColor: '#007aff',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer' },
      { key: 'company', label: 'Company', placeholder: 'Acme Corp', optional: true },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', optional: true },
      { key: 'website', label: 'Website', placeholder: 'https://example.com', type: 'url', optional: true },
      { key: 'color', label: 'Accent color', placeholder: '#007aff', type: 'color' },
    ],
    html: f => fill(
      `<div style="font-family:-apple-system,sans-serif;font-size:13px;padding-left:12px;border-left:3px solid {{color}}">
  <p style="margin:0;font-size:15px;font-weight:700;color:#1c1c1e">{{name}}</p>
  <p style="margin:2px 0 8px;color:#8e8e93">{{title}}${f.company ? ' · {{company}}' : ''}</p>
  <p style="margin:0"><a href="mailto:{{email}}" style="color:{{color}};text-decoration:none">{{email}}</a></p>
  ${f.phone ? `<p style="margin:2px 0 0;color:#8e8e93">{{phone}}</p>` : ''}
  ${f.website ? `<p style="margin:2px 0 0"><a href="{{website}}" style="color:{{color}};text-decoration:none">{{website}}</a></p>` : ''}
</div>`,
      f,
    ),
  },
  {
    id: 'card',
    name: 'Card',
    defaultColor: '#007aff',
    fields: [
      { key: 'name', label: 'Full name', placeholder: 'Jane Doe' },
      { key: 'title', label: 'Job title', placeholder: 'Software Engineer' },
      { key: 'company', label: 'Company', placeholder: 'Acme Corp', optional: true },
      { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
      { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890', optional: true },
      { key: 'color', label: 'Accent color', placeholder: '#007aff', type: 'color' },
    ],
    html: f => fill(
      `<div style="display:inline-block;font-family:-apple-system,sans-serif;padding:12px 16px;border:1px solid #e5e5ea;border-top:3px solid {{color}};border-radius:8px;font-size:13px;min-width:200px">
  <p style="margin:0;font-weight:700;font-size:14px;color:#1c1c1e">{{name}}</p>
  <p style="margin:2px 0 10px;color:#8e8e93;font-size:12px">{{title}}${f.company ? ' · {{company}}' : ''}</p>
  <p style="margin:0"><a href="mailto:{{email}}" style="color:{{color}};text-decoration:none">{{email}}</a></p>
  ${f.phone ? `<p style="margin:3px 0 0;color:#8e8e93">{{phone}}</p>` : ''}
</div>`,
      f,
    ),
  },
]
