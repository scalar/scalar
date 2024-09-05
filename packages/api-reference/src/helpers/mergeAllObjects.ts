/**
 * Merges an array of objects into a single object.
 */
export const mergeAllObjects = (items: Record<any, any>[]): any => {
  return items.reduce((acc, object) => {
    return {
      ...acc,
      ...object,
    }
  }, {})
}
