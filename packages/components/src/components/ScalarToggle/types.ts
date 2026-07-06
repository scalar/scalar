import type { ScalarCheckboxOption } from '../ScalarCheckboxInput'

/**
 * A tristate option for ScalarTristateToggleGroup.
 *
 * The `checked` value is only meaningful when the option is present in the
 * model array — absence from the array means the option is unset.
 */
export type ScalarTristateOption = ScalarCheckboxOption & { checked: boolean }
