/**
 * This is just to make the new types compatible as we we can assume we are already dereferenced
 *
 * @deprecated
 */
export type ForceDereference<T> = Exclude<T, { $ref: string }>

/**
 * We should already be dereferenced at this point, so this is just for type safety
 *
 * @deprecated Just for compatibility with the old types
 */
export const dereference = <T extends object>(v: T | undefined): ForceDereference<T> | null => {
  if (v === undefined || '$ref' in v) {
    return null
  }

  return v as ForceDereference<T>
}
