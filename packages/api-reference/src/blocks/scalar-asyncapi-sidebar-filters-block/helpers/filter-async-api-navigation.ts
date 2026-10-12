import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import {
  ALL,
  type AsyncApiReachabilityContext,
  createReachabilityContext,
  getChannelReachability,
  getOperationReachability,
} from '@scalar/workspace-store/channel-example'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import {
  type AsyncApiTags,
  getAsyncApiEntryTags,
  getAsyncApiTags,
} from '@/components/Content/AsyncApi/helpers/get-async-api-tags'
import { resolveAsyncApiChannel } from '@/components/Content/AsyncApi/helpers/resolve-async-api-nodes'

/** The currently selected sidebar filters. Empty / sentinel values disable a filter. */
type AsyncApiNavigationFilter = {
  /** Selected protocol id, or {@link ALL} / undefined for no protocol filter. */
  protocol?: string
  /** Selected server name, or {@link ALL} / undefined for no server filter. */
  server?: string
  /** Exact tag name. Empty / undefined clears this filter. */
  tag?: string
}

/** Whether protocol and server selections leave reachability unrestricted. */
const isNoopReachabilityFilter = ({ protocol, server }: AsyncApiNavigationFilter): boolean =>
  (!protocol || protocol === ALL) && (!server || server === ALL)

/** Whether a selection (protocol or server) keeps an operation, given the set it is reachable through. */
const selectionMatches = (reachable: Set<string>, selected: string | undefined): boolean =>
  !selected || selected === ALL || reachable.has(selected)

/**
 * Filters one navigation entry against the selected protocol/server.
 *
 * - `asyncapi-operation` — kept only when the operation matches both filters.
 * - `asyncapi-message` — channel catalog messages match their channel servers/protocols.
 * - Channels without operations are matched using their own server availability.
 * - Channels / tags are recursed into and dropped when filtering removes all children.
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

    // Use the same target as navigation, ignoring any sibling channel override.
    const operation = getResolvedAsyncApiRef(operationNode)

    // Resolve the operation's reachability once, then test both selections against it.
    if (!operation) {
      return entry
    }
    const { protocols, serverNames } = getOperationReachability(document, operation, context)
    const keep = selectionMatches(protocols, filter.protocol) && selectionMatches(serverNames, filter.server)

    return keep ? entry : null
  }

  if (entry.type === 'asyncapi-channel' && !entry.children?.some((child) => child.type === 'asyncapi-operation')) {
    const channelNode = document.channels?.[entry.channelName]
    if (channelNode) {
      const channel = getResolvedAsyncApiRef(channelNode)
      if (!channel) {
        return entry
      }
      const { protocols, serverNames } = getChannelReachability(document, channel, context)
      if (!selectionMatches(protocols, filter.protocol) || !selectionMatches(serverNames, filter.server)) {
        return null
      }
    }
  }

  if (entry.type === 'asyncapi-message') {
    const channelNode = document.channels?.[entry.channelName]
    if (!channelNode) {
      return entry
    }

    const channel = getResolvedAsyncApiRef(channelNode)
    if (!channel) {
      return entry
    }
    const { protocols, serverNames } = getChannelReachability(document, channel, context)
    return selectionMatches(protocols, filter.protocol) && selectionMatches(serverNames, filter.server) ? entry : null
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
 * Filters the AsyncAPI sidebar tree by protocol, server, and tag while retaining parent context.
 *
 * Returns the original entries untouched when no filter is active, so OpenAPI
 * documents and the unfiltered AsyncAPI case pay no cost.
 */
export const filterAsyncApiNavigation = (
  entries: TraversedEntry[],
  document: AsyncApiDocument,
  filter: AsyncApiNavigationFilter,
): TraversedEntry[] => {
  if (isNoopReachabilityFilter(filter) && !filter.tag) {
    return entries
  }

  // Build the document-level reachability lookups once for the whole pass.
  const context = createReachabilityContext(document)

  const reachableEntries = isNoopReachabilityFilter(filter)
    ? entries
    : entries.flatMap((entry) => {
        const filtered = filterEntry(entry, document, filter, context)
        return filtered ? [filtered] : []
      })
  if (!filter.tag) {
    return reachableEntries
  }

  const matches = (tags: AsyncApiTags): boolean => getAsyncApiTags(tags).some((tag) => tag.name === filter.tag)
  const taggedServers = new Set(
    Object.entries(document.servers ?? {}).flatMap(([name, node]) => {
      const server = getResolvedRef(node)
      return matches(server?.tags) &&
        selectionMatches(new Set([name]), filter.server) &&
        selectionMatches(new Set([context.serverProtocols.get(name) ?? '']), filter.protocol)
        ? [name]
        : []
    }),
  )

  const filterTags = (entry: TraversedEntry): TraversedEntry | null => {
    const isAsyncApi =
      entry.type === 'asyncapi-channel' || entry.type === 'asyncapi-operation' || entry.type === 'asyncapi-message'
    if (!isAsyncApi && entry.type !== 'tag') {
      return entry
    }
    if (isAsyncApi) {
      const channel = resolveAsyncApiChannel(document, entry.channelName)
      const { serverNames } = getChannelReachability(document, channel ?? null, context)
      if (matches(getAsyncApiEntryTags(entry, document)) || [...serverNames].some((name) => taggedServers.has(name))) {
        return entry
      }
    }
    // Descendant matches keep their ancestors as context, without unrelated siblings.
    if (entry.type === 'asyncapi-message') {
      return null
    }
    const children = entry.children?.flatMap((child) => {
      const filtered = filterTags(child)
      return filtered ? [filtered] : []
    })
    return children?.length ? { ...entry, children } : null
  }
  return reachableEntries.flatMap((entry) => {
    const filtered = filterTags(entry)
    return filtered ? [filtered] : []
  })
}
