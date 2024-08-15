/**
 * Check if the value is a filesystem
 */
export function isFilesystem(value: any) {
  return (
    value !== undefined &&
    Array.isArray(value) &&
    value.length > 0 &&
    value.some((file) => file.isEntrypoint === true)
  )
}
