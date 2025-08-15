import { type NodeInput, getResolvedRef, type Dereference } from './get-resolved-ref'

/** Type helper to track depth  */
type IncrementDepth<D extends number> = D extends 0 ? 1 : D extends 1 ? 2 : D extends 2 ? 3 : D extends 3 ? 4 : 5

/**
 * Recursively resolves $ref objects up to 5 levels deep.
 * This type helper ensures proper typing for deeply nested ref resolution.
 */
export type DeepDereference<T, Depth extends number = 0> = Depth extends 5
  ? T
  : Dereference<T> extends T
    ? T extends (infer U)[]
      ? DeepDereference<U, Depth>[]
      : T extends object
        ? {
            [K in keyof T]: DeepDereference<T[K], IncrementDepth<Depth>>
          }
        : T
    : Dereference<T> extends object
      ? {
          [K in keyof Dereference<T>]: DeepDereference<Dereference<T>[K], IncrementDepth<Depth>>
        }
      : Dereference<T>

/**
 * The same as getResolvedRef, but recursively resolves all $ref objects.
 * Includes circular reference detection to prevent infinite loops.
 * Types are resolved up to 5 levels deep for better TypeScript inference.
 */
export const getResolvedRefDeep = <Node>(node: NodeInput<Node>): DeepDereference<Node> => {
  const cache = new WeakMap<object, any>()

  const resolveDeep = (currentNode: NodeInput<Node>): DeepDereference<Node> => {
    // First resolve this level
    const resolved = getResolvedRef(currentNode)

    // If it's not an object, return as-is
    if (typeof resolved !== 'object' || resolved === null) {
      return resolved as DeepDereference<Node>
    }

    // Check if we've already processed this object (cache hit)
    if (cache.has(resolved)) {
      return cache.get(resolved)
    }

    // For circular reference detection, we cache a placeholder first
    // This prevents infinite recursion while still allowing the object to be processed
    const isArray = Array.isArray(resolved)
    const placeholder = isArray ? [] : {}
    cache.set(resolved, placeholder)

    let result

    // Process the object/array recursively
    if (isArray) {
      result = resolved.map((item) => resolveDeep(item)) as Node
    } else {
      result = {} as any
      for (const [key, value] of Object.entries(resolved)) {
        result[key] = resolveDeep(value)
      }
    }

    // Update cache with the final result
    cache.set(resolved, result)

    return result
  }

  return resolveDeep(node)
}
