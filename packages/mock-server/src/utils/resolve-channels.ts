import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { AsyncApiDocument, AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import {
  ASYNCAPI_WEBSOCKET_PROTOCOLS,
  getAllChannelMessages,
  getAsyncApiServers,
  getChannelOperations,
  resolveChannel,
} from '@scalar/workspace-store/channel-example'
import { getNameFromRef } from '@scalar/workspace-store/helpers/get-name-from-ref'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

import type { ResolvedChannel, ResolvedMessage, ResolvedOperation } from '@/transports/types'
import { honoRouteFromPath } from '@/utils/hono-route-from-path'

/** Extract a plain JSON Schema from a message `payload`, unwrapping the Multi Format Schema Object. */
function extractPayloadSchema(payload: unknown): OpenAPIV3_1.SchemaObject | undefined {
  const resolved = getResolvedRef(payload as any)
  if (!resolved || typeof resolved !== 'object') {
    return undefined
  }

  // Multi Format Schema Object: `{ schemaFormat, schema }`. The actual schema lives under `schema`.
  if ('schemaFormat' in resolved && 'schema' in resolved) {
    return getResolvedRef((resolved as any).schema) as OpenAPIV3_1.SchemaObject
  }

  return resolved as OpenAPIV3_1.SchemaObject
}

/**
 * Adapt a resolved AsyncAPI message into the transport-facing {@link ResolvedMessage} shape: a plain
 * payload schema (ready for `getExampleFromSchema`), any defined examples, and the content type.
 *
 * @param key - The message's key in `channel.messages` (what operation `$ref`s point at).
 * @param message - The dereferenced AsyncAPI message object.
 */
function toResolvedMessage(key: string, message: AsyncApiMessageObject, defaultContentType?: string): ResolvedMessage {
  const resolved = message as Record<string, any>

  const examples = Array.isArray(resolved.examples)
    ? resolved.examples
        .map((example: unknown) => getResolvedRef(example as any))
        .filter((example: any): example is Record<string, any> => example?.payload !== undefined)
        .map((example: Record<string, any>) => example.payload)
    : []

  return {
    id: resolved.name ?? key,
    payload: extractPayloadSchema(resolved.payload),
    examples,
    contentType: resolved.contentType ?? defaultContentType,
  }
}

/**
 * Collect the connection protocols (lower-cased) advertised for a channel. Server protocols come
 * from the shared workspace-store resolver (the same one the API client uses), so the mock and the
 * client classify a document identically. A WebSocket binding is an additional reliable hint when
 * the channel declares no servers.
 */
function resolveProtocols(document: AsyncApiDocument, channel: Record<string, any>): string[] {
  const protocols = new Set<string>()

  for (const server of getAsyncApiServers(document, { channel: channel as any, webSocketOnly: false })) {
    if (server.protocol) {
      protocols.add(server.protocol)
    }
  }

  const bindings = getResolvedRef(channel.bindings) as Record<string, unknown> | undefined
  if (bindings?.ws) {
    protocols.add(ASYNCAPI_WEBSOCKET_PROTOCOLS[0])
  }

  return [...protocols]
}

/**
 * Normalize an AsyncAPI 3.1 document into a flat list of {@link ResolvedChannel}s a transport can
 * serve. Channel, message, operation, and server resolution are delegated to
 * `@scalar/workspace-store/channel-example` — the same layer the API client uses to connect to
 * channels — so the mock and the client agree on how a document maps to channels and operations
 * (including operation traits). This function only adapts that output into the transport types.
 */
export function resolveChannels(document: AsyncApiDocument): ResolvedChannel[] {
  const channelNames = Object.keys(document.channels ?? {})

  return channelNames.flatMap((channelName) => {
    const resolved = resolveChannel(document, channelName)
    if (!resolved) {
      return []
    }

    const { channel, channelAddress } = resolved

    const messageEntries = getAllChannelMessages(document, channel)
    const messages = messageEntries.map(({ name, message }) =>
      toResolvedMessage(name, message, document.defaultContentType),
    )
    // Keyed by the `channels.*.messages` key (what operation `$ref`s point at), which can differ
    // from a message's resolved `id` when the message declares a `name`.
    const messagesByKey = new Map(messageEntries.map(({ name }, index) => [name, messages[index]!]))

    const operations: ResolvedOperation[] = getChannelOperations(document, channelName).map(
      ({ operationName, operation, action }) => {
        // An operation may scope itself to a subset of the channel's messages; otherwise use all.
        const operationMessages: ResolvedMessage[] = Array.isArray(operation.messages)
          ? operation.messages
              .map((message: any) => message?.['$ref'])
              .filter((ref: unknown): ref is string => typeof ref === 'string')
              .map((ref: string) => messagesByKey.get(getNameFromRef(ref, ['channels', channelName, 'messages']) ?? ''))
              .filter((message: ResolvedMessage | undefined): message is ResolvedMessage => message !== undefined)
          : messages

        return { id: operationName, action, messages: operationMessages } satisfies ResolvedOperation
      },
    )

    return [
      {
        id: channelName,
        address: channelAddress,
        route: honoRouteFromPath(`/${channelAddress.replace(/^\//, '')}`),
        protocols: resolveProtocols(document, channel),
        operations,
        messages,
      } satisfies ResolvedChannel,
    ]
  })
}
