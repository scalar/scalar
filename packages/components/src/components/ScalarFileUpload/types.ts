export type FileExtension = `.${string}`

export type ExtensionList = FileExtension[]

/**
 * Type guard to check if a value is an ExtensionList
 */
export function isExtensionList(
  value: ExtensionList | string,
): value is ExtensionList {
  return Array.isArray(value) && value.every((item) => item.startsWith('.'))
}
