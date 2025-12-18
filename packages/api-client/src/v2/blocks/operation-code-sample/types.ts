import type { ScalarComboboxOption, ScalarComboboxOptionGroup } from '@scalar/components'
import type { AvailableClients, ClientId, TargetId } from '@scalar/snippetz'

/**
 * Represents a client option in the request example block.
 * Extends the base combobox option with language-specific information
 * for generating code examples in different programming languages.
 */
export type ClientOption = ScalarComboboxOption & {
  /** A more specific ID */
  id: AvailableClients[number]
  /** Programming language or tool for code generation (e.g., 'javascript', 'python', 'curl') */
  lang: TargetId | 'curl' | 'plaintext'
  /** Title shows when the client is selected in the dropdown */
  title: string
  /** Target key for the client, differs from the lang due to the curl thing */
  targetKey: TargetId
  /** Title of the target */
  targetTitle: string
  /** Client key for the client */
  clientKey: ClientId<TargetId>
}

/**
 * Augments the base combobox option group with ClientOptions
 */
export type ClientOptionGroup = Omit<ScalarComboboxOptionGroup, 'options'> & {
  /** Array of client options that belong to this group */
  options: ClientOption[]
}

/** Better type safety when we have custom clients in the selector */
export type CustomClientOption = ScalarComboboxOption & {
  /** A custom ID */
  id: `custom/${string}`
  /** Programming language or tool for code generation (e.g., 'javascript', 'python', 'curl') */
  lang: TargetId | 'curl' | 'plaintext'
  /** Title shows when the client is selected in the dropdown */
  title: string
  /** Client key for the client */
  clientKey: 'custom'
}

/** Augments the base combobox option group with CustomClientOptions */
export type CustomClientOptionGroup = Omit<ScalarComboboxOptionGroup, 'options'> & {
  /** Array of client options that belong to this group */
  options: (ClientOption | CustomClientOption)[]
}
