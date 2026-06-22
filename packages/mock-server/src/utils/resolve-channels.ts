import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { AsyncApiDocument, AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

import type { ResolvedChannel, ResolvedMessage, ResolvedOperation } from '@/transports/types'
import { honoRouteFromPath } from '@/utils/hono-route-from-path'

/** Decode the final segment of a JSON Pointer `$ref` (e.g. `#/channels/user~1signup` -> `user/signup`). */
function refTail(ref: string): string {
  const last = ref.split('/').pop() ?? ''
  return last.replace(/~1/g, '/').replace(/~0/g, '~')
}

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

/** Build a {@link ResolvedMessage} from a (possibly `$ref`) message object. */
function resolveMessage(id: string, message: unknown, defaultContentType?: string): ResolvedMessage {
  const resolved = getResolvedRef(message as any) as Record<string, any> | undefined

  const examples = Array.isArray(resolved?.examples)
    ? resolved.examples
        .map((example: unknown) => getResolvedRef(example as any))
        .filter((example: any): example is Record<string, any> => example?.payload !== undefined)
        .map((example: Record<string, any>) => example.payload)
    : []

  return {
    id: resolved?.name ?? id,
    payload: extractPayloadSchema(resolved?.payload),
    examples,
    contentType: resolved?.contentType ?? defaultContentType,
  }
}

/** Collect the connection protocols (lower-cased) advertised for a channel. */
function resolveProtocols(channel: Record<string, any>, document: AsyncApiDocument): string[] {
  const protocols = new Set<string>()

  const addServerProtocol = (server: unknown) => {
    const resolved = getResolvedRef(server as any) as AsyncApiServerObject | undefined
    if (resolved?.protocol) {
      protocols.add(resolved.protocol.toLowerCase())
    }
  }

  if (Array.isArray(channel.servers) && channel.servers.length > 0) {
    // The channel restricts itself to specific servers.
    channel.servers.forEach(addServerProtocol)
  } else if (document.servers) {
    // No restriction: the channel is available on every document server.
    Object.values(document.servers).forEach(addServerProtocol)
  }

  // Binding presence is a reliable protocol hint even when servers are omitted.
  const bindings = getResolvedRef(channel.bindings) as Record<string, unknown> | undefined
  if (bindings?.ws) {
    protocols.add('ws')
  }

  return [...protocols]
}

/**
 * Normalize an AsyncAPI 3.1 document into a flat list of {@link ResolvedChannel}s with all
 * `$ref`s resolved, so transports can serve channels without touching AsyncAPI document shape.
 */
export function resolveChannels(document: AsyncApiDocument): ResolvedChannel[] {
  const channels = document.channels ?? {}
  const operations = document.operations ?? {}

  return Object.entries(channels).map(([channelId, rawChannel]) => {
    const channel = getResolvedRef(rawChannel as any) as Record<string, any>
    const address = typeof channel.address === 'string' ? channel.address : channelId

    // Channel-level messages, keyed by their `channels.*.messages` key. Operation `$ref`s point at
    // this key, which can differ from the message's `name` (and therefore from `message.id`), so the
    // lookup map is keyed by the original key rather than the resolved id.
    const messageEntries = Object.entries((channel.messages ?? {}) as Record<string, unknown>)
    const messages = messageEntries.map(([messageId, message]) =>
      resolveMessage(messageId, message, document.defaultContentType),
    )
    const messagesByKey = new Map(messageEntries.map(([key], index) => [key, messages[index]!]))

    // Operations that target this channel, matched via their `channel` `$ref`.
    const channelOperations: ResolvedOperation[] = Object.entries(operations)
      .map(([operationId, rawOperation]) => ({ operationId, operation: getResolvedRef(rawOperation as any) as any }))
      .filter(({ operation }) => {
        const ref = operation?.channel?.['$ref'] as string | undefined
        return typeof ref === 'string' && refTail(ref) === channelId
      })
      .map(({ operationId, operation }) => {
        // An operation may scope itself to a subset of the channel's messages; otherwise use all.
        const operationMessages: ResolvedMessage[] = Array.isArray(operation.messages)
          ? operation.messages
              .map((message: any) => message?.['$ref'])
              .filter((ref: unknown): ref is string => typeof ref === 'string')
              .map((ref: string) => messagesByKey.get(refTail(ref)))
              .filter((message: ResolvedMessage | undefined): message is ResolvedMessage => message !== undefined)
          : messages

        return {
          id: operationId,
          action: operation.action === 'send' ? 'send' : 'receive',
          messages: operationMessages,
        } satisfies ResolvedOperation
      })

    return {
      id: channelId,
      address,
      route: honoRouteFromPath(`/${address.replace(/^\//, '')}`),
      protocols: resolveProtocols(channel, document),
      operations: channelOperations,
      messages,
    } satisfies ResolvedChannel
  })
}
