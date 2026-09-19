import { isObject } from '@scalar/helpers/object/is-object'
import { type Dereference, getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyShallow } from '@scalar/workspace-store/helpers/unpack-proxy'

// `$ref-value` is optional, matching `get-resolved-ref.ts` and the reference schemas: an unresolved
// `{ $ref }` has none yet. The runtime branches on `'$ref' in current` and defers to `getResolvedRef`,
// so it already copes with an absent value.
type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value'?: Node | RefNode<Node> }
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

    // Identity only: the raw object keys the caches below and is never read from or returned, so the
    // outermost proxies come off and the node's own properties are left alone.
    const rawValue = unpackProxyShallow(current)

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
      // `getResolvedRef` follows a chain of pure pass-through references, so a component that resolve()
      // left behind as a `$global` stub reaches the node the stub points at rather than the stub.
      const resolved = getResolvedRef(current)
      const result = resolveNode(resolved)

      // Preserve keywords declared alongside the `$ref`. A `$ref` may carry siblings that specialize the
      // target — most notably the `$defs`/`$dynamicAnchor` binding used to express a generic schema like
      // `Paginated<Planet>`. Per OpenAPI 3.1, siblings of a `$ref` override the resolved value, so we merge
      // them on top. Without this the dynamic-ref binding is dropped and `$dynamicRef` cannot resolve.
      let merged: Record<string, unknown> | undefined = undefined
      if (isObject(result)) {
        for (const key of Object.keys(current)) {
          if (key === '$ref' || key === '$ref-value') {
            continue
          }
          merged ??= { ...result }
          merged[key] = resolveNode(current[key])
        }
      }

      const value = merged ?? result
      cachedResults.set(rawValue, value)
      return value
    }

    // For arrays
    if (Array.isArray(current)) {
      const result = new Array(current.length)
      for (let index = 0; index < current.length; index++) {
        result[index] = resolveNode(current[index])
      }
      cachedResults.set(rawValue, result)
      return result
    }

    const result: Record<string, unknown> = {}
    for (const key of Object.keys(current)) {
      result[key] = resolveNode(current[key])
    }
    cachedResults.set(rawValue, result)
    return result
  }

  return resolveNode(node)
}
