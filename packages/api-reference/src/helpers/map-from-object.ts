/**
 * Map an object to an array of key-value pairs.
 */
export const mapFromObject = (
  object: Record<string, any>,
  keyName?: string,
): {
  [keyName: string]: any
  value: any
}[] => {
  return Object.keys(object).map((key) => {
    return {
      [keyName ?? key]: key,
      value: object[key],
    }
  })
}
