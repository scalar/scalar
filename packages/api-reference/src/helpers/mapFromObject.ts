/**
 * Map an object to an array of key-value pairs.
 */
export const mapFromObject = (object: Record<string, any>) => {
  return Object.keys(object).map((key) => {
    return {
      key,
      value: object[key],
    }
  })
}
