import type { AnyObject } from '../types'

/**
 * Recursively traverses the specification and applies the transform function to each node.
 */
export function traverse(
  specification: AnyObject,
  transform: (specification: AnyObject, path?: string[]) => AnyObject,
  path: string[] = [],
) {
  const result: AnyObject = {}

  for (const [key, value] of Object.entries(specification)) {
    const currentPath = [...path, key]
    if (Array.isArray(value)) {
      result[key] = value.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return traverse(item, transform, [...currentPath, index.toString()])
        }
        return item
      })
    } else if (typeof value === 'object' && value !== null) {
      result[key] = traverse(value, transform, currentPath)
    } else {
      result[key] = value
    }
  }

  return transform(result, path)
}
