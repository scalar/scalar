export type Option = {
  id: string
  label: string
  disabled?: boolean
  [x: string]: any
}

export type OptionStyle = 'radio' | 'checkbox'
