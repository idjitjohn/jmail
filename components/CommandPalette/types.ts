export type Command = {
  id: string
  label: string
  description: string
  icon: string
  shortcut?: string
  run: () => void
}
