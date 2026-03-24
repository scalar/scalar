/**
 * Returns true if the given value is a non-null object (including arrays, plain objects, etc.).
 * Used to distinguish objects (excluding null) from primitives.
 */
export const isObject = (value: unknown): value is Record<string | number | symbol, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
