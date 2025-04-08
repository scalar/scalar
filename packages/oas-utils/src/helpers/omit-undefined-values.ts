/**
 * Removes undefined values from an object.
 *
 * Can be used as a transform function for any Zod schema.
 */
export const omitUndefinedValues = <T extends object>(data: T): T => {
  // Handle arrays specially
  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === 'object' && item !== null ? omitUndefinedValues(item) : item,
    ) as unknown as T
  }

  return Object.fromEntries(
    Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return [key, omitUndefinedValues(value)]
        }
        return [key, value]
      }),
  ) as T
}
