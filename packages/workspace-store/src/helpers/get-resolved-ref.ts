import { isObject } from '@scalar/helpers/object/is-object'

export type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value': Node }
export type NodeInput<Node> = Node | RefNode<Node>

/** Default transform function that overwrites the $ref properties with the $ref-value properties */
const defaultTransform = <Node>(node: RefNode<Node>): Node => {
  // For objects we should merge the $ref-value properties with the node properties
  if (isObject(node['$ref-value'])) {
    const { $ref: _, '$ref-value': refValue, ...rest } = node
    return {
      ...rest,
      ...refValue,
    } as Node
  }

  // Otherwise we just return the ref-value
  return node['$ref-value']
}

/**
 * Resolves a node that may be a $ref object to its actual value.
 * If the node contains a $ref, applies the provided transform (default: returns '$ref-value').
 * Otherwise, returns the node as-is.
 */
export const getResolvedRef = <Node>(
  node: NodeInput<Node>,
  transform: (node: RefNode<Node>) => Node = defaultTransform,
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
