/**
 * Utility function to extract all keys starting with 'x-' (OpenAPI extensions) from an object.
 *
 * @param object - The object from which to extract extension keys.
 * @returns An object containing only the entries whose keys start with 'x-'.
 */
export const getXKeysFromObject = (object?: Record<string, unknown>) => {
  if (!object) {
    // Return an empty object if input is undefined or null
    return {}
  }
  // Filter and return only the entries whose keys start with 'x-'
  return Object.fromEntries(Object.entries(object).filter(([key]) => key.startsWith('x-')))
}
