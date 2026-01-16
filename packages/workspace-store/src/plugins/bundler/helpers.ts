import type { UnknownObject } from '@/helpers/general'
import { getValueByPath } from '@/helpers/json-path-utils'

/**
 * Recursively resolves the value behind a $ref pointer within the current document tree.
 * For example, given a node with { $ref: '#/some/path' }, this will locate and return
 * the referenced node, following the $ref chain if necessary.
 *
 * @param node - The node that may be a $ref object. If not, returns the node as is.
 * @returns The resolved node if a $ref chain exists, otherwise the original node.
 */
export const getResolvedRef = (node: unknown, context: { rootNode: UnknownObject }): unknown => {
  if (
    node &&
    typeof node === 'object' &&
    '$ref' in node &&
    typeof node['$ref'] === 'string' &&
    node['$ref'].startsWith('#')
  ) {
    // If the $ref is a local JSON Pointer (starts with '#/'), split path and resolve recursively
    // const path = node['$ref'].startsWith('#') ? node['$ref'].slice(1) : undefined
    const segments = node['$ref'].slice(1).split('/')
    if (segments) {
      segments.shift()
      // Recursively dereference in case the resolved value is itself a $ref
      return getResolvedRef(getValueByPath(context.rootNode, segments), context)
    }
    return null
  }
  // If this node isn't a $ref, return it as the resolved value
  return node
}
