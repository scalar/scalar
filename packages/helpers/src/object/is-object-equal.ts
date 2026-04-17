import { isObjectLike } from '@/object/is-object'

/**
 * Compares two values with deep equality semantics.
 *
 * This utility is optimized for nested arrays and object-like values and uses
 * `Object.is` for primitive and reference identity checks.
 */
export const isObjectEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) {
    return true
  }

  if (!isObjectLike(a) || !isObjectLike(b)) {
    return false
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false
    }

    for (let i = 0; i < a.length; i += 1) {
      if (!isObjectEqual(a[i], b[i])) {
        return false
      }
    }

    return true
  }

  if (Array.isArray(b)) {
    return false
  }

  const leftObject = a as Record<string, unknown>
  const rightObject = b as Record<string, unknown>

  // Count only own enumerable keys so inherited properties do not affect equality.
  let leftCount = 0
  for (const key in leftObject) {
    if (!Object.hasOwn(leftObject, key)) {
      continue
    }

    leftCount += 1

    if (!Object.hasOwn(rightObject, key) || !isObjectEqual(leftObject[key], rightObject[key])) {
      return false
    }
  }

  let rightCount = 0
  for (const key in rightObject) {
    if (!Object.hasOwn(rightObject, key)) {
      continue
    }

    rightCount += 1
  }

  return leftCount === rightCount
}
