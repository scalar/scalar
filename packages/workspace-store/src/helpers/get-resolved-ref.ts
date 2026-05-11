export type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value': Node }
export type NodeInput<Node> = Node | RefNode<Node>

const defaultTransform = <Node>(node: RefNode<Node>) => {
  return node['$ref-value']
}

/**
 * Transform for getResolvedRef that merges sibling properties of a $ref wrapper
 * onto the dereferenced value. Wrapper siblings take precedence over the resolved value,
 * which matches OpenAPI 3.1 semantics where annotations alongside $ref override the target.
 */
export const mergeSiblingReferences = <Node>(node: RefNode<Node>): Node => {
  const { '$ref-value': value, ...rest } = node
  return { ...value, ...rest } as Node
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
