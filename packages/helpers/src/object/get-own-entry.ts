/** Returns an own property value, or undefined when the entry is absent or inherited. */
export const getOwnEntry = <T extends object, K extends keyof T>(record: T | undefined, key: K): T[K] | undefined => {
  // The presence check tracks additions and deletions when the record is a Vue reactive proxy.
  return record && key in record && Object.hasOwn(record, key) ? record[key] : undefined
}
