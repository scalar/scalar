import type { ScalarCheckboxOption } from '../ScalarCheckboxInput'

/**
 * A tristate option for ScalarTristateToggleGroup.
 *
 * The `checked` value is only meaningful when the option is present in the
 * model array — absence from the array means the option is unset.
 */
export type ScalarTristateOption = ScalarCheckboxOption & { checked: boolean }

/**
 * Size of a ScalarToggle or ScalarTristateToggle.
 *
 * `sm` is the compact toggle used in dense lists and menus. `md` is the larger
 * toggle for settings rows that sit alongside full-height form controls.
 */
export type ScalarToggleSize = 'sm' | 'md'
