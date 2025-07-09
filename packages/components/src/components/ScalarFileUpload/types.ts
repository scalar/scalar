export type FileExtension = `.${string}`

export type ExtensionList = FileExtension[]

/**
 * Type guard to check if a value is an ExtensionList
 */
export function isExtensionList(value: ExtensionList | string): value is ExtensionList {
  return Array.isArray(value) && value.every((item) => item.startsWith('.'))
}

/**
 * Props for both the default and compact variants of the FileUploadInput
 */
export type FileUploadInputProps = {
  /** Whether multiple files can be uploaded */
  multiple?: boolean
  /** A list of extensions that are supported */
  extensions?: ExtensionList
}

/**
 * Emits for both the default and compact variants of the FileUploadInput
 */
export type FileUploadInputEmits = {
  /** Emitted when the user clicks the browse button */
  (e: 'click', event: MouseEvent): void
}

/**
 * Slots for both the default and compact variants of the FileUploadInput
 */
export type FileUploadInputSlots = {
  /** The default label slot */
  default?(): unknown
  /** The sublabel or error slot */
  sublabel?(): unknown
}
