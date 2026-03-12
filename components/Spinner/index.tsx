import './Spinner.scss'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

export default function Spinner({ size = 'md' }: Props) {
  return (
    <span className={`Spinner ${size}`}>
      <span className="ring" />
    </span>
  )
}
