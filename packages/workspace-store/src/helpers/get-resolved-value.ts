type RefNode<Node> = Partial<Node> & { $ref: string; '$ref-value': Node }
type NodeInput<Node> = Node | RefNode<Node>

const defaultTransform = <Node>(node: RefNode<Node>) => {
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
