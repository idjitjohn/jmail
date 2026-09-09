export type MailAction = {
  id: string
  label: string
  icon: string
  onClick?: () => void
  href?: string
  download?: boolean
  disabled?: boolean
  active?: boolean
  danger?: boolean
}
