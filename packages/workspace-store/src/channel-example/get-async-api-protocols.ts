import { objectEntries } from '@scalar/helpers/object/object-entries'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import type { AsyncApiChannelObject, AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { getNameFromRef } from '@/helpers/get-name-from-ref'
import { getResolvedRef } from '@/helpers/get-resolved-ref'

import { resolveOperationChannel } from './resolve-operation-channel'

/** Sentinel used by the protocol picker to mean "don't filter by protocol". */
export const ALL_PROTOCOLS = 'all' as const

/** Sentinel used by the server picker to mean "don't filter by server". */
export const ALL_SERVERS = 'all' as const

/** A single protocol option for the picker (e.g. `{ id: 'mqtt', label: 'MQTT' }`). */
export type AsyncApiProtocolOption = {
  /** The normalized protocol id (lowercase), or {@link ALL_PROTOCOLS}. */
  id: string
  /** Human-friendly label shown in the dropdown. */
  label: string
}

const getServerNameFromRef = (ref: string): string | undefined => getNameFromRef(ref, ['servers'])

/** Normalizes a protocol string the same way the server list does (trimmed + lowercased). */
const normalizeProtocol = (protocol: string | undefined): string | undefined => {
  const normalized = protocol?.trim().toLowerCase()
  return normalized ? normalized : undefined
}

/**
 * Returns the protocol of every named server, keyed by server name.
 * References are resolved so a `$ref`-only server still contributes its protocol.
 */
const getServerProtocols = (document: AsyncApiDocument): Map<string, string> => {
  const protocols = new Map<string, string>()

  for (const [name, serverNode] of objectEntries(document.servers ?? {})) {
    const server = getResolvedRef(serverNode)
    const protocol = normalizeProtocol(server.protocol)
    if (protocol) {
      protocols.set(name, protocol)
    }
  }

  return protocols
}

/**
 * The server names a channel is available on.
 *
 * When the channel does not declare `servers`, it is available on every server,
 * so we return `undefined` to signal "all servers" (mirrors `getAsyncApiServers`).
 */
const getChannelServerNames = (channel: AsyncApiChannelObject | undefined): Set<string> | undefined => {
  if (!channel?.servers) {
    return undefined
  }

  const names = new Set<string>()
  for (const serverRef of channel.servers) {
    if ('$ref' in serverRef) {
      const name = getServerNameFromRef(serverRef.$ref)
      if (name) {
        names.add(name)
      }
    }
  }
  return names
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

  return [{ id: ALL_PROTOCOLS, label: 'All protocols' }, ...options]
}

/**
 * Returns the set of protocols an operation is reachable over.
 *
 * Resolves the operation's channel, then maps the channel's servers (or all
 * servers when the channel declares none) to their protocols.
 */
export const getOperationProtocols = (document: AsyncApiDocument, operation: AsyncApiOperationObject): Set<string> => {
  const serverProtocols = getServerProtocols(document)
  const channel = resolveOperationChannel(document, operation)?.channel
  const channelServerNames = getChannelServerNames(channel)

  const protocols = new Set<string>()
  for (const [name, protocol] of serverProtocols) {
    if (channelServerNames?.has(name) ?? true) {
      protocols.add(protocol)
    }
  }

  return protocols
}

/**
 * Whether an operation should be shown for the currently selected protocol.
 *
 * Selecting {@link ALL_PROTOCOLS} (or nothing) matches every operation; otherwise
 * the operation is kept only when one of its channel's servers uses that protocol.
 */
export const operationMatchesProtocol = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
  protocol: string | undefined,
): boolean => {
  if (!protocol || protocol === ALL_PROTOCOLS) {
    return true
  }

  return getOperationProtocols(document, operation).has(protocol)
}

/** A single server option for the picker (e.g. `{ id: 'mqtt-prod', label: 'mqtt-prod (mqtt)' }`). */
export type AsyncApiServerOption = {
  /** The server name (its key in `document.servers`), or {@link ALL_SERVERS}. */
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

  return [{ id: ALL_SERVERS, label: 'All servers' }, ...options]
}

/**
 * Returns the names of the servers an operation is reachable through.
 *
 * Resolves the operation's channel, then returns the channel's servers (or all
 * declared servers when the channel pins none).
 */
export const getOperationServerNames = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
): Set<string> => {
  const allServerNames = new Set(objectKeys(document.servers ?? {}))
  const channel = resolveOperationChannel(document, operation)?.channel
  const channelServerNames = getChannelServerNames(channel)

  if (!channelServerNames) {
    return allServerNames
  }

  return new Set([...channelServerNames].filter((name) => allServerNames.has(name)))
}

/**
 * Whether an operation should be shown for the currently selected server.
 *
 * Selecting {@link ALL_SERVERS} (or nothing) matches every operation; otherwise the
 * operation is kept only when its channel is reachable through that server.
 */
export const operationMatchesServer = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
  serverName: string | undefined,
): boolean => {
  if (!serverName || serverName === ALL_SERVERS) {
    return true
  }

  return getOperationServerNames(document, operation).has(serverName)
}
