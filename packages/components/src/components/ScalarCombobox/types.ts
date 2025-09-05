export type Option = {
  id: string
  label: string
}

export type OptionGroup<O extends Option = Option> = {
  label: string
  options: O[]
}

export type OptionsOrGroups<O extends Option = Option, G extends OptionGroup<O> = OptionGroup<O>> = O[] | G[]

/** Type guard to check if an option is a group */
export function isGroup(option: Option | OptionGroup | undefined): option is OptionGroup {
  return (option as OptionGroup | undefined)?.options !== undefined
}

/** Type guard to check if an array of options is an array of groups */
export function isGroups(options: Option[] | OptionGroup[]): options is OptionGroup[] {
  if (!options[0]) {
    return false // No options to test, so we assume it's not a group
  }
  return isGroup(options[0])
}

/** Available events emitted by the combobox */
export type ComboboxEmits = {
  /** Emitted when the "Add a new option" button is clicked */
  add: []
}

/** Available slots for the combobox */
export type ComboboxSlots<O extends Option = Option, G extends OptionGroup<O> = OptionGroup<O>> = {
  /** The reference element / trigger for the combobox */
  default(props: { open: boolean }): unknown
  /** A template to override the option label */
  option?(props: { option: O; active: boolean; selected: boolean }): unknown
  /** A template to override the group label */
  group?(props: { group: G }): unknown
  /** Creates an "Add a new option" button after the options list*/
  add?(props: { active: boolean }): unknown
}
