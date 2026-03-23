/**
 * Returns true if the given value is a non-null object (including arrays, plain objects, etc.).
 * Used to distinguish objects (excluding null) from primitives.
 */
export const isObject = (value: unknown): value is Record<string | number | symbol, unknown> =>
  typeof value === 'object' && value !== null
