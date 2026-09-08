'use client'
import { useRecipientInput } from './useRecipientInput'
import './RecipientInput.scss'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}
const RecipientInput = ({ label, value, onChange, autoFocus }: Props) => {
  const vm = useRecipientInput(value)
  return (
    <div className="RecipientInput">
      <label htmlFor={vm.id}>{label}</label>
      <input
        id={vm.id}
        type="text"
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        list={`${vm.id}-contacts`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
        placeholder="Name or email · separate addresses with commas"
      />
      <datalist id={`${vm.id}-contacts`}>
        {vm.suggestions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </datalist>
    </div>
  )
}
export default RecipientInput
