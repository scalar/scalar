/** `Node.DOCUMENT_FRAGMENT_NODE`, inlined so this also runs where `Node` is not defined (SSR) */
const DOCUMENT_FRAGMENT_NODE = 11

/**
 * Checks whether a node is a shadow root
 *
 * Use this instead of `root instanceof ShadowRoot`. The global `ShadowRoot` does not exist
 * during SSR, and `instanceof` fails for nodes from another realm (an iframe). A shadow root
 * is the only document fragment with a `host`, so checking for both works everywhere.
 */
export const isShadowRoot = (node: Node | null | undefined): node is ShadowRoot =>
  node?.nodeType === DOCUMENT_FRAGMENT_NODE && 'host' in node
