export type Option = {
  id: string
  label: string
  isDeletable?: boolean
  [x: string]: any
}

export type OptionGroup = {
  label: string
  options: Option[]
}

export const isGroup = (
  option: Option | OptionGroup,
): option is OptionGroup => {
  return (option as OptionGroup).options !== undefined
}

export const isGroups = (
  options: Option[] | OptionGroup[],
): options is OptionGroup[] => {
  return isGroup(options[0])
}
