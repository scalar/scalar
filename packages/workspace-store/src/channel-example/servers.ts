import { objectEntries } from '@scalar/helpers/object/object-entries'
import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
  AsyncApiOperationObject,
  AsyncApiServerObject,
} from '@scalar/types/asyncapi/3.1'

import {
  type BuildConnectionUrlInput,
  buildAsyncApiServerBaseUrl,
  buildConnectionUrl,
  isWebSocketProtocol,
} from '@/channel-example/build-connection-url'
import { getNameFromRef } from '@/helpers/get-name-from-ref'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isAsyncApiDocument } from '@/schemas/type-guards'
import type { WorkspaceDocument } from '@/schemas/workspace'

export type AsyncApiServerListOptions = {
  channel?: AsyncApiChannelObject | null
  operation?: AsyncApiOperationObject | null
  pathParameters?: Record<string, string>
  queryParameters?: Record<string, string>
  environmentVariables?: BuildConnectionUrlInput['environmentVariables']
  /** When true (default), only servers with `ws` or `wss` protocol are returned. */
  webSocketOnly?: boolean
}

export type AsyncApiServerEntry = {
  /** Key in `document.servers`. */
  name: string
  server: AsyncApiServerObject
  host: string
  protocol: string
  description?: string
  title?: string
  /** Base URL (scheme + host + pathname) without the channel address. */
  url: string
  /** Full WebSocket URL when `channel` is provided in list options. */
  connectionUrl?: string
  /** Whether this server uses a WebSocket protocol (`ws` / `wss`). */
  isWebSocket: boolean
}

const resolveServer = (server: NonNullable<AsyncApiDocument['servers']>[string]): AsyncApiServerObject =>
  getResolvedRef(server)

export const getServerNameFromRef = (ref: string): string | undefined => getNameFromRef(ref, ['servers'])

/**
 * Collects the names of `document.servers` entries that the channel is restricted to.
 *
 * Returns `undefined` when the channel does not declare `servers`, signaling that every
 * top-level server is allowed.
 */
export const getChannelServerNames = (
  document: AsyncApiDocument,
  channel: AsyncApiChannelObject | null,
): Set<string> | undefined => {
  if (!channel?.servers) {
    return undefined
  }

  const names = new Set<string>()
  for (const serverRef of channel.servers) {
    const name = getServerNameFromRef(serverRef.$ref)
    if (name && document.servers?.[name]) {
      names.add(name)
    }
  }
  return names
}

/**
 * Returns a normalized list of AsyncAPI servers with computed base `url` and optional `connectionUrl`.
 */
export const getAsyncApiServers = (
  document: AsyncApiDocument,
  options: AsyncApiServerListOptions = {},
): AsyncApiServerEntry[] => {
  const {
    channel = null,
    operation = null,
    pathParameters = {},
    queryParameters = {},
    environmentVariables,
    webSocketOnly = true,
  } = options

  const servers = document.servers ?? {}
  const channelServerNames = getChannelServerNames(document, channel)

  return objectEntries(servers)
    .filter(([name]) => channelServerNames?.has(name) ?? true)
    .map(([name, serverRef]) => {
      const server = resolveServer(serverRef)
      const protocol = server.protocol.trim().toLowerCase()
      const isWebSocket = isWebSocketProtocol(protocol)
      const url = buildAsyncApiServerBaseUrl(server, environmentVariables)

      const entry: AsyncApiServerEntry = {
        name,
        server,
        host: server.host,
        protocol,
        description: server.description,
        title: server.title,
        url,
        isWebSocket,
      }

      if (channel) {
        entry.connectionUrl = buildConnectionUrl({
          server,
          channel,
          operation,
          pathParameters,
          queryParameters,
          environmentVariables,
        })
      }

      return entry
    })
    .filter((entry) => (webSocketOnly ? entry.isWebSocket : true))
}

/**
 * Returns the selected AsyncAPI server entry, using `x-scalar-selected-asyncapi-server` on the document.
 */
export const getSelectedAsyncApiServer = (
  document: WorkspaceDocument | null,
  servers: AsyncApiServerEntry[],
  _operation?: AsyncApiOperationObject | null,
): AsyncApiServerEntry | null => {
  if (!isAsyncApiDocument(document)) {
    return servers[0] ?? null
  }

  const selectedName = document['x-scalar-selected-server']

  if (selectedName == null) {
    return servers[0] ?? null
  }

  return servers.find(({ name }) => name === selectedName) ?? servers[0] ?? null
}
