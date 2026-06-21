import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import {
  ALL_PROTOCOLS,
  ALL_SERVERS,
  operationMatchesProtocol,
  operationMatchesServer,
} from '@scalar/workspace-store/channel-example'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

/** The currently selected sidebar filters. Empty / sentinel values disable a filter. */
export type AsyncApiNavigationFilter = {
  /** Selected protocol id, or {@link ALL_PROTOCOLS} / undefined for no protocol filter. */
  protocol?: string
  /** Selected server name, or {@link ALL_SERVERS} / undefined for no server filter. */
  server?: string
}

/** Whether the filter would keep every entry, so the tree can be returned untouched. */
const isNoopFilter = ({ protocol, server }: AsyncApiNavigationFilter): boolean =>
  (!protocol || protocol === ALL_PROTOCOLS) && (!server || server === ALL_SERVERS)

/**
 * Filters one navigation entry against the selected protocol/server.
 *
 * - `asyncapi-operation` — kept only when the operation matches both filters.
 * - `asyncapi-channel` / `tag` — recursed into, then dropped when they have no
 *   children left (so empty channels and tags disappear from the sidebar).
 * - Everything else (description, models, schemas) passes through unchanged.
 *
 * Returns `null` when the entry should be removed.
 */
const filterEntry = (
  entry: TraversedEntry,
  document: AsyncApiDocument,
  filter: AsyncApiNavigationFilter,
): TraversedEntry | null => {
  if (entry.type === 'asyncapi-operation') {
    const operationNode = document.operations?.[entry.operationName]
    // If the operation can't be resolved we keep it rather than hide it by accident.
    if (!operationNode) {
      return entry
    }

    const operation = getResolvedRef(operationNode)
    const keep =
      operationMatchesProtocol(document, operation, filter.protocol) &&
      operationMatchesServer(document, operation, filter.server)

    return keep ? entry : null
  }

  if (entry.type === 'asyncapi-channel' || entry.type === 'tag') {
    const originalChildren = entry.children ?? []
    const children = originalChildren.flatMap((child) => {
      const filtered = filterEntry(child, document, filter)
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

  return entries.flatMap((entry) => {
    const filtered = filterEntry(entry, document, filter)
    return filtered ? [filtered] : []
  })
}
