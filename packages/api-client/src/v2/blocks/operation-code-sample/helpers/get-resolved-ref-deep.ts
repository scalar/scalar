import { isObject } from '@scalar/helpers/object/is-object'
import { type Dereference, getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'

type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value': Node | RefNode<Node> }
type NodeInput<Node> = Node | RefNode<Node>

/**
 * Recursively resolves $ref objects
 * This type helper ensures proper typing for deeply nested ref resolution.
 * Properties that could contain $ref objects may resolve to '[circular]' if we have a circular reference.
 */
type DeepDereference<T> = Dereference<T> extends T
  ? T extends readonly (infer U)[]
    ? DeepDereference<U>[]
    : T extends object
      ? { [K in keyof T]: T[K] extends RefNode<any> ? DeepDereference<T[K]> | '[circular]' : DeepDereference<T[K]> }
      : T
  : Dereference<T> extends object
    ? {
        [K in keyof Dereference<T>]: Dereference<T>[K] extends RefNode<any>
          ? DeepDereference<Dereference<T>[K]> | '[circular]'
          : DeepDereference<Dereference<T>[K]>
      }
    : Dereference<T>

/**
 * Recursively resolves all $ref objects in a data structure to their actual values.
 * Traverses through objects, arrays, and nested structures to find and resolve
 * any $ref references at any depth level.
 *
 * Handles circular references gracefully by detecting them and returning '[circular]'
 * to prevent infinite loops.
 */
export const getResolvedRefDeep = <Node>(node: NodeInput<Node>): DeepDereference<NodeInput<Node>> => {
  const visited = new WeakSet<object>()
  const cachedResults = new WeakMap<object, any>()

  const resolveNode = (current: any): any => {
    // Only recurse into objects and arrays; return primitives as-is
    if (!isObject(current) && !Array.isArray(current)) {
      return current
    }

    const rawValue = unpackProxyObject(current, { depth: 1 })

    // We don't have to recurse into the same object again
    // This helps us having to manually remove the tracked node after we recurse into the tree
    if (cachedResults.has(rawValue)) {
      return cachedResults.get(rawValue)
    }

    // Break circular references
    if (visited.has(rawValue)) {
      return '[circular]'
    }

    // Track visited nodes
    visited.add(rawValue)

    if ('$ref' in current) {
      const resolved = getResolvedRef(current)
      const result = resolveNode(resolved)
      cachedResults.set(rawValue, result)
      return result
    }

    // For arrays
    if (Array.isArray(current)) {
      const result = current.map(resolveNode)
      cachedResults.set(rawValue, result)
      return result
    }

    const result = Object.fromEntries(Object.entries(current).map(([key, value]) => [key, resolveNode(value)]))
    cachedResults.set(rawValue, result)
    return result
  }

  return resolveNode(node)
}
