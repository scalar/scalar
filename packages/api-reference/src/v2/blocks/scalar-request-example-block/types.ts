import type { ScalarComboboxOption, ScalarComboboxOptionGroup } from '@scalar/components'
import type { TargetId } from '@scalar/snippetz'

/**
 * Represents a client option in the request example block.
 * Extends the base combobox option with language-specific information
 * for generating code examples in different programming languages.
 */
export type ClientOption = ScalarComboboxOption & {
  /** The programming language or tool for code generation (e.g., 'javascript', 'python', 'curl') */
  lang: TargetId | 'curl' | 'plaintext'
  /** The title shows when the client is selected in the dropdown */
  title: string
}

/**
 * Augments the base combobox option group with ClientOptions
 */
export type ClientOptionGroup = Omit<ScalarComboboxOptionGroup, 'options'> & {
  /** Array of client options that belong to this group */
  options: ClientOption[]
}
