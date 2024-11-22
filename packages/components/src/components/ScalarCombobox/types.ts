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

/** Type guard to check if an option is a group */
export function isGroup(option: Option | OptionGroup): option is OptionGroup {
  return (option as OptionGroup).options !== undefined
}

/** Type guard to check if an array of options is an array of groups */
export function isGroups(
  options: Option[] | OptionGroup[],
): options is OptionGroup[] {
  return isGroup(options[0])
}
