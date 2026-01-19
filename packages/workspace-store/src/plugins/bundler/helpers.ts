import { getSegmentsFromPath } from '@scalar/json-magic/helpers/get-segments-from-path'

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
    const segments = getSegmentsFromPath(node['$ref'].slice(1))
    return getResolvedRef(getValueByPath(context.rootNode, segments), context)
  }
  // If this node isn't a $ref, return it as the resolved value
  return node
}
