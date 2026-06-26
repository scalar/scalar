import { objectEntries } from '@scalar/helpers/object/object-entries'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef } from '@/helpers/get-resolved-ref'

import { normalizeProtocol } from './build-connection-url'
import { resolveOperationChannel } from './resolve-operation-channel'
import { getChannelServerNames } from './servers'

/** Sentinel used by the protocol and server pickers to mean "don't filter". */
export const ALL = 'all' as const

/** A single protocol option for the picker (e.g. `{ id: 'mqtt', label: 'MQTT' }`). */
export type AsyncApiProtocolOption = {
  /** The normalized protocol id (lowercase), or {@link ALL}. */
  id: string
  /** Human-friendly label shown in the dropdown. */
  label: string
}

/**
 * Returns the protocol of every named server, keyed by server name.
 * References are resolved so a `$ref`-only server still contributes its protocol.
 */
const getServerProtocols = (document: AsyncApiDocument): Map<string, string> => {
  const protocols = new Map<string, string>()

  for (const [name, serverNode] of objectEntries(document.servers ?? {})) {
    const protocol = normalizeProtocol(getResolvedRef(serverNode).protocol)
    if (protocol) {
      protocols.set(name, protocol)
    }
  }

  return protocols
}

/**
 * Builds the protocol options for the picker from a document's servers.
 *
 * Always prepends an "All protocols" entry so the picker can clear the filter,
 * matching how the document picker always offers every document. Protocols are
 * de-duplicated and sorted alphabetically for a stable order.
 */
export const getAsyncApiProtocols = (document: AsyncApiDocument): AsyncApiProtocolOption[] => {
  const unique = new Set(getServerProtocols(document).values())

  const options: AsyncApiProtocolOption[] = [...unique]
    .sort((a, b) => a.localeCompare(b))
    .map((protocol) => ({ id: protocol, label: protocol.toUpperCase() }))

  return [{ id: ALL, label: 'All protocols' }, ...options]
}

/** A single server option for the picker (e.g. `{ id: 'mqtt-prod', label: 'mqtt-prod (mqtt)' }`). */
export type AsyncApiServerOption = {
  /** The server name (its key in `document.servers`), or {@link ALL}. */
  id: string
  /** Human-friendly label: the server name, suffixed with its protocol when known. */
  label: string
}

/**
 * Builds the server options for the picker from a document's servers.
 *
 * Like {@link getAsyncApiProtocols}, always prepends an "All servers" entry so the
 * filter can be cleared. Each option is labelled with the server name and its
 * protocol so the picker reads as `mqtt-prod (mqtt)`.
 */
export const getAsyncApiServerOptions = (document: AsyncApiDocument): AsyncApiServerOption[] => {
  const options: AsyncApiServerOption[] = objectEntries(document.servers ?? {}).map(([name, serverNode]) => {
    const protocol = normalizeProtocol(getResolvedRef(serverNode).protocol)
    return { id: name, label: protocol ? `${name} (${protocol})` : name }
  })

  return [{ id: ALL, label: 'All servers' }, ...options]
}

/**
 * Document-level lookups the per-operation reachability check needs.
 *
 * Building this once per filter pass (instead of recomputing it for every operation)
 * keeps sidebar filtering at O(operations + servers) rather than O(operations × servers).
 */
export type AsyncApiReachabilityContext = {
  /** Normalized protocol of every named server, keyed by server name. */
  serverProtocols: Map<string, string>
  /** Every server name declared on the document. */
  allServerNames: Set<string>
}

/** Precomputes the document-level data shared across every operation in a filter pass. */
export const createReachabilityContext = (document: AsyncApiDocument): AsyncApiReachabilityContext => ({
  serverProtocols: getServerProtocols(document),
  allServerNames: new Set(objectKeys(document.servers ?? {})),
})

/** The servers (and the protocols they speak) a single operation is reachable through. */
export type OperationReachability = {
  /** Server names the operation's channel can be reached through. */
  serverNames: Set<string>
  /** Protocols those servers use. */
  protocols: Set<string>
}

/**
 * Resolves the servers and protocols a single operation is reachable over.
 *
 * Resolves the operation's channel once, then intersects the channel's servers
 * (or all servers, when the channel pins none) with the document's servers. The
 * shared {@link AsyncApiReachabilityContext} is built once per filter pass; a fresh
 * one is created when called standalone.
 */
export const getOperationReachability = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
  context: AsyncApiReachabilityContext = createReachabilityContext(document),
): OperationReachability => {
  const channel = resolveOperationChannel(document, operation)?.channel ?? null
  const channelServerNames = getChannelServerNames(document, channel)

  // A channel without declared servers is reachable on every server.
  const serverNames = channelServerNames
    ? new Set([...channelServerNames].filter((name) => context.allServerNames.has(name)))
    : new Set(context.allServerNames)

  const protocols = new Set<string>()
  for (const [name, protocol] of context.serverProtocols) {
    if (serverNames.has(name)) {
      protocols.add(protocol)
    }
  }

  return { serverNames, protocols }
}

/**
 * Returns the set of protocols an operation is reachable over.
 */
export const getOperationProtocols = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
  context?: AsyncApiReachabilityContext,
): Set<string> => getOperationReachability(document, operation, context).protocols

/**
 * Returns the names of the servers an operation is reachable through.
 */
export const getOperationServerNames = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
  context?: AsyncApiReachabilityContext,
): Set<string> => getOperationReachability(document, operation, context).serverNames

/**
 * Whether an operation should be shown for the currently selected protocol.
 *
 * Selecting {@link ALL} (or nothing) matches every operation; otherwise the
 * operation is kept only when one of its channel's servers uses that protocol.
 */
export const operationMatchesProtocol = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
  protocol: string | undefined,
  context?: AsyncApiReachabilityContext,
): boolean => {
  if (!protocol || protocol === ALL) {
    return true
  }

  return getOperationProtocols(document, operation, context).has(protocol)
}

/**
 * Whether an operation should be shown for the currently selected server.
 *
 * Selecting {@link ALL} (or nothing) matches every operation; otherwise the
 * operation is kept only when its channel is reachable through that server.
 */
export const operationMatchesServer = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
  serverName: string | undefined,
  context?: AsyncApiReachabilityContext,
): boolean => {
  if (!serverName || serverName === ALL) {
    return true
  }

  return getOperationServerNames(document, operation, context).has(serverName)
}
