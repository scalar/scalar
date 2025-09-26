import { getRaw } from '@scalar/json-magic/magic-proxy'
import type { Dereference } from '@scalar/workspace-store/helpers/get-resolved-ref'

export type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value': Node | RefNode<Node> }
export type NodeInput<Node> = Node | RefNode<Node>

/**
 * Recursively resolves $ref objects
 * This type helper ensures proper typing for deeply nested ref resolution.
 * Properties that could contain $ref objects may resolve to '[circular]' if we have a circular reference.
 */
export type DeepDereference<T> = Dereference<T> extends T
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
  const visited = new WeakSet()

  const resolveNode = (current: any): any => {
    // Handle primitives and null/undefined
    if (current === null || current === undefined || typeof current !== 'object') {
      return current
    }

    // Get raw value to check for circular references
    const raw = getRaw(current)

    // Circular reference detected
    if (visited.has(raw)) {
      return '[circular]'
    }

    visited.add(raw)

    // Handle $ref objects
    if (typeof current === 'object' && current !== null && '$ref' in current) {
      const refValue = current['$ref-value']
      // Recursively resolve the referenced value
      const resolved = resolveNode(refValue)
      visited.delete(raw) // Remove from visited after processing to allow multiple non-circular references
      return resolved
    }

    // Handle arrays
    if (Array.isArray(current)) {
      const resolvedArray = current.map((item) => resolveNode(item))
      visited.delete(raw)
      return resolvedArray
    }

    // Handle regular objects - recursively process all properties
    if (typeof current === 'object' && current !== null) {
      const resolvedObject: any = {}

      for (const [key, value] of Object.entries(current)) {
        resolvedObject[key] = resolveNode(value)
      }

      visited.delete(raw)
      return resolvedObject
    }

    visited.delete(raw)
    return current
  }

  return resolveNode(node)
}
