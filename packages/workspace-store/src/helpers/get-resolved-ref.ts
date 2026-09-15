import { isObject } from '@scalar/helpers/object/is-object'

export type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value'?: Node }
export type NodeInput<Node> = Node | RefNode<Node>

const defaultTransform = <Node>(node: RefNode<Node>) => {
  // Unresolved references have no value; callers must account for that state.
  return node['$ref-value']
}

/**
 * Transform for getResolvedRef that merges sibling properties of a $ref wrapper
 * onto the dereferenced value. Wrapper siblings take precedence over the resolved value,
 * which matches OpenAPI 3.1 semantics where annotations alongside $ref override the target.
 */
export const mergeSiblingReferences = <Node>(node: RefNode<Node>): Node => {
  const { '$ref-value': value, ...rest } = node

  // A reference can land on something that is not a record: a pointer that aims at a string
  // (`$ref: '#/info/title'`), one that was never resolved, or one whose target is an array. Spreading
  // any of those copies it index by index, so a reference to a title becomes `{ 0: 'G', 1: 'a', … }`
  // and every consumer downstream treats those digits as real properties. There is nothing to merge
  // siblings onto in that case, so only the siblings survive.
  if (!isObject(value)) {
    return rest as Node
  }

  return { ...value, ...rest }
}

/**
 * Resolves a node that may be a $ref object to its actual value.
 * If the node contains a $ref, applies the provided transform (default: returns '$ref-value').
 * Otherwise, returns the node as-is.
 */
export function getResolvedRef<Node, Result>(
  node: NodeInput<Node>,
  transform: (node: RefNode<Node>) => Result,
): Node | Result
export function getResolvedRef<Node>(node: { $ref: string; '$ref-value': Node }): Node
export function getResolvedRef<Node>(node: NodeInput<Node>): Node | undefined
export function getResolvedRef<Node, Result>(
  node: NodeInput<Node>,
  transform: (node: RefNode<Node>) => Result | Node | undefined = defaultTransform,
): Node | Result | undefined {
  if (typeof node === 'object' && node !== null && '$ref' in node) {
    return transform(node)
  }
  return node
}

/**
 * Type helper we can use if we have getResolvedRef higher in the stack
 */
export type Dereference<T> = T extends { $ref: string; '$ref-value'?: infer V } ? (V extends object ? V : never) : T
