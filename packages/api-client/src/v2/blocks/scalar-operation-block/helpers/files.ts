/**
 * Extract file name from an input
 */
export const getFileName = (input: unknown) => {
  if (input instanceof File) {
    return input.name
  }
  return undefined
}
