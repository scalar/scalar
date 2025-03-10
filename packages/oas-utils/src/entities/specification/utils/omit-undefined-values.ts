/**
 * Removes undefined values from an object.
 *
 * Can be used as a transform function for any Zod schema.
 */
export const omitUndefinedValues = <T extends object>(data: T): T => {
  return Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined)) as T
}
