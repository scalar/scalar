import type { UnknownObject } from '@scalar/types/utils'

function merge(from: UnknownObject, to: UnknownObject): UnknownObject {
  if (from !== to && typeof from === 'object' && from !== null) {
    for (const key of Object.keys(to)) {
      if (!Object.hasOwn(from, key)) {
        delete to[key]
      }
    }

    for (const [k, v] of Object.entries(from)) {
      to[k] = v
    }
  }

  return to
}

/**
 * Recursively traverses the content and applies the transform function to each node.
 */
export function traverse(
  content: UnknownObject,
  transform: (content: UnknownObject, path?: string[]) => UnknownObject,
) {
  const cache = new WeakMap<UnknownObject, UnknownObject>()

  function walk(node: UnknownObject, path: string[]): UnknownObject {
    const cached = cache.get(node)
    if (cached) {
      return cached
    }

    const result: UnknownObject = {}
    cache.set(node, result)

    for (const [key, value] of Object.entries(node)) {
      const currentPath = [...path, key]

      if (Array.isArray(value)) {
        result[key] = value.map((item, index) => {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            return walk(item, [...currentPath, index.toString()])
          }
          return item
        })
        continue
      }

      if (typeof value === 'object' && value !== null) {
        result[key] = walk(value as UnknownObject, currentPath)
        continue
      }

      result[key] = value
    }

    const transformed = transform(result, path)

    return merge(transformed, result)
  }

  return walk(content, [])
}
