import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import {
  ALL,
  type AsyncApiReachabilityContext,
  createReachabilityContext,
  getOperationReachability,
} from '@scalar/workspace-store/channel-example'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

/** The currently selected sidebar filters. Empty / sentinel values disable a filter. */
type AsyncApiNavigationFilter = {
  /** Selected protocol id, or {@link ALL} / undefined for no protocol filter. */
  protocol?: string
  /** Selected server name, or {@link ALL} / undefined for no server filter. */
  server?: string
}

/** Whether the filter would keep every entry, so the tree can be returned untouched. */
const isNoopFilter = ({ protocol, server }: AsyncApiNavigationFilter): boolean =>
  (!protocol || protocol === ALL) && (!server || server === ALL)

/** Whether a selection (protocol or server) keeps an operation, given the set it is reachable through. */
const selectionMatches = (reachable: Set<string>, selected: string | undefined): boolean =>
  !selected || selected === ALL || reachable.has(selected)

/**
 * Filters one navigation entry against the selected protocol/server.
 *
 * - `asyncapi-operation` — kept only when the operation matches both filters.
 * - `asyncapi-channel` / `tag` — recursed into, then dropped when they have no
 *   children left (so empty channels and tags disappear from the sidebar).
 * - Everything else (description, models, schemas) passes through unchanged.
 *
 * `context` carries the document-level lookups so they are built once per filter
 * pass rather than recomputed for every operation.
 *
 * Returns `null` when the entry should be removed.
 */
const filterEntry = (
  entry: TraversedEntry,
  document: AsyncApiDocument,
  filter: AsyncApiNavigationFilter,
  context: AsyncApiReachabilityContext,
): TraversedEntry | null => {
  if (entry.type === 'asyncapi-operation') {
    const operationNode = document.operations?.[entry.operationName]
    // If the operation can't be resolved we keep it rather than hide it by accident.
    if (!operationNode) {
      return entry
    }

    // Resolve the same way the navigation traversal did, so sibling overrides
    // (e.g. an inline `channel` alongside a `$ref`) are honored consistently.
    const operation = getResolvedRef(operationNode, mergeSiblingReferences)

    // Resolve the operation's reachability once, then test both selections against it.
    const { protocols, serverNames } = getOperationReachability(document, operation, context)
    const keep = selectionMatches(protocols, filter.protocol) && selectionMatches(serverNames, filter.server)

    return keep ? entry : null
  }

  if (entry.type === 'asyncapi-channel' || entry.type === 'tag') {
    const originalChildren = entry.children ?? []
    const children = originalChildren.flatMap((child) => {
      const filtered = filterEntry(child, document, filter, context)
      return filtered ? [filtered] : []
    })

    // Drop a container that had children but lost them all to the filter.
    if (originalChildren.length > 0 && children.length === 0) {
      return null
    }

    return { ...entry, children }
  }

  return entry
}

/**
 * Filters the AsyncAPI sidebar tree by the selected protocol and/or server.
 *
 * Returns the original entries untouched when no filter is active, so OpenAPI
 * documents and the unfiltered AsyncAPI case pay no cost.
 */
export const filterAsyncApiNavigation = (
  entries: TraversedEntry[],
  document: AsyncApiDocument,
  filter: AsyncApiNavigationFilter,
): TraversedEntry[] => {
  if (isNoopFilter(filter)) {
    return entries
  }

  // Build the document-level reachability lookups once for the whole pass.
  const context = createReachabilityContext(document)

  return entries.flatMap((entry) => {
    const filtered = filterEntry(entry, document, filter, context)
    return filtered ? [filtered] : []
  })
}
