import { isObjectLike } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/**
 * Recursively traverses the content and applies the transform function to each node.
 */
export function traverse(
  content: UnknownObject,
  transform: (content: UnknownObject, path?: string[]) => UnknownObject,
  path: string[] = [],
) {
  // Define input keys as own properties before assignment, including literal __proto__ mapping keys.
  const result: UnknownObject = { ...content }

  for (const [key, value] of Object.entries(content)) {
    const currentPath = [...path, key]

    if (Array.isArray(value)) {
      result[key] = value.map((item, index) => {
        if (typeof item === 'object' && !Array.isArray(item) && item !== null) {
          return traverse(item, transform, [...currentPath, index.toString()])
        }

        return item
      })

      continue
    }

    if (isObjectLike(value)) {
      result[key] = traverse(value, transform, currentPath)

      continue
    }

    result[key] = value
  }

  return transform(result, path)
}
