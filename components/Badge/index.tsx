import './Badge.scss'

interface Props {
  count: number
  max?: number
}

export default function Badge({ count, max = 99 }: Props) {
  if (count <= 0) return null
  const label = count > max ? `${max}+` : String(count)

  return <span className="Badge">{label}</span>
}
