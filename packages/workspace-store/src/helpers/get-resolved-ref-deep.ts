import { type NodeInput, getResolvedRef, type Dereference } from './get-resolved-ref'

/**
 * Recursively resolves $ref objects
 * This type helper ensures proper typing for deeply nested ref resolution.
 */
export type DeepDereference<T> = Dereference<T> extends T
  ? T extends readonly (infer U)[]
    ? DeepDereference<U>[]
    : T extends object
      ? { [K in keyof T]: DeepDereference<T[K]> }
      : T
  : Dereference<T> extends object
    ? { [K in keyof Dereference<T>]: DeepDereference<Dereference<T>[K]> }
    : Dereference<T>

/**
 * The same as getResolvedRef, but recursively resolves all $ref objects.
 * Includes circular reference detection to prevent infinite loops.
 * Types are resolved up to 5 levels deep for better TypeScript inference.
 */
export const getResolvedRefDeep = <Node>(node: NodeInput<Node>): DeepDereference<Node> => {
  const cache = new WeakMap<object, DeepDereference<Node>>()

  const resolveDeep = (currentNode: NodeInput<Node>): DeepDereference<Node> => {
    // First resolve this level
    const resolved = getResolvedRef(currentNode)

    // If it's not an object, return as-is
    if (typeof resolved !== 'object' || resolved === null) {
      return resolved as DeepDereference<Node>
    }

    // Check if we've already processed this object (cache hit)
    if (cache.has(resolved)) {
      return cache.get(resolved)!
    }

    // For circular reference detection, we cache a placeholder first
    // This prevents infinite recursion while still allowing the object to be processed
    const isArray = Array.isArray(resolved)
    const placeholder = (isArray ? [] : {}) as DeepDereference<Node>
    cache.set(resolved, placeholder)

    // Process the object/array recursively and mutate the placeholder
    if (isArray) {
      // Mutate the placeholder array instead of creating a new one
      const placeholderArray = placeholder as unknown[]
      for (let i = 0; i < resolved.length; i++) {
        placeholderArray[i] = resolveDeep(resolved[i])
      }
    }
    // Mutate the placeholder object instead of creating a new one
    else {
      const placeholderObject = placeholder as Record<string, unknown>
      for (const [key, value] of Object.entries(resolved)) {
        placeholderObject[key] = resolveDeep(value)
      }
    }

    return placeholder
  }

  return resolveDeep(node)
}
