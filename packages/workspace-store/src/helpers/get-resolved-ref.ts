import { getRaw } from '@scalar/json-magic/magic-proxy'

export type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value': Node | RefNode<Node> }
export type NodeInput<Node> = Node | RefNode<Node>

/**
 * Recursively resolves a RefNode by following its '$ref-value' chain
 * until a non-ref value is reached.
 */
const defaultTransform = <Node>(node: RefNode<Node>, visited = new WeakSet<RefNode<Node>>()) => {
  if (visited.has(getRaw(node))) {
    return undefined // Circular reference detected
  }

  visited.add(getRaw(node))

  const resolved = node['$ref-value']

  if (typeof resolved === 'object' && resolved !== null && '$ref' in resolved) {
    return defaultTransform(resolved, visited)
  }

  return resolved
}

/**
 * Resolves a node that may be a $ref object to its actual value.
 * If the node contains a $ref, applies the provided transform (default: returns '$ref-value').
 * Otherwise, returns the node as-is.
 */
export const getResolvedRef = <Node>(
  node: NodeInput<Node>,
  transform: (node: RefNode<Node>) => Node | undefined = defaultTransform,
) => {
  if (typeof node === 'object' && node !== null && '$ref' in node) {
    return transform(node)
  }

  return node
}

/**
 * Type helper we can use if we have getResolvedRef higher in the stack
 */
export type Dereference<T> = T extends { $ref: string; '$ref-value'?: infer V } ? (V extends object ? V : never) : T
