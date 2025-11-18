/**
 * Get the root document node for a given element
 *
 * Returns the shadow root if the element is inside a shadow DOM,
 * otherwise returns the document
 *
 * @param node - The node to get the root document for
 * @returns The root document (Document)
 *
 * @example
 * ```ts
 * const root = getRootDocument(someElement)
 * // If in shadow DOM: returns ShadowRoot
 * // If in regular DOM: returns document
 * ```
 */
export function getRootDocument(node: Node): Document | ShadowRoot {
  const rootNode = node.getRootNode()

  // If the root node is a ShadowRoot, return it
  if (rootNode instanceof ShadowRoot) {
    return rootNode
  }

  // Otherwise, return the document
  return node.ownerDocument ?? document
}
