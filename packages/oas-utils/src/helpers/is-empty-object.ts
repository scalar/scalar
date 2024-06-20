/**
 * Checks for an empty object
 * @see https://stackoverflow.com/a/32108184
 */
export const isEmptyObject = (obj: object) => {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false
    }
  }

  return true
}
