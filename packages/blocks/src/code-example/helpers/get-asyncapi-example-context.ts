import { isObject } from '@scalar/helpers/object/is-object'
import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
  AsyncApiMessageObject,
  AsyncApiOperationObject,
} from '@scalar/types/asyncapi/3.1'
import {
  type AsyncApiServerEntry,
  type ChannelMessageEntry,
  getAllChannelMessages,
  getAsyncApiServers,
  getChannelParameters,
  resolveOperationChannel,
  resolveOperationWithTraits,
} from '@scalar/workspace-store/channel-example'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import { resolveTraits } from '@scalar/workspace-store/helpers/resolve-traits'

/** Authored operation samples are independent of the transport used by the channel. */
type AsyncApiCodeSample = { lang: string; label?: string; source: string }

type AsyncApiExampleContext = {
  operation: AsyncApiOperationObject
  channel: AsyncApiChannelObject | undefined
  messages: ChannelMessageEntry[]
  samples: AsyncApiCodeSample[]
  server: AsyncApiServerEntry | undefined
}

/** Resolve operation-level samples and only the messages that operation permits. */
export const getAsyncApiExampleContext = (
  document: AsyncApiDocument,
  operationName: string,
  selectedServer?: string,
): AsyncApiExampleContext | undefined => {
  const node = getResolvedAsyncApiRef(document.operations?.[operationName])
  if (!node) {
    return undefined
  }
  const operation = resolveOperationWithTraits(node)
  const resolved = resolveOperationChannel(document, operation)
  const channel = resolved?.channel
  const messages =
    operation.messages === undefined
      ? channel
        ? getAllChannelMessages(document, channel)
        : []
      : operation.messages.flatMap((ref, index) => {
          const message = getResolvedAsyncApiRef(ref)
          return message && !('$ref' in message) ? [{ name: ref.$ref ?? String(index), message }] : []
        })
  const resolvedMessages = messages.map(({ name, message }) => ({
    name,
    message: resolveTraits(message, message.traits ?? []) satisfies AsyncApiMessageObject,
  }))
  const extensions: Record<string, unknown> = { ...operation }
  const samples: AsyncApiCodeSample[] = (['x-codeSamples', 'x-code-samples'] as const).flatMap((key) => {
    const values = extensions[key]
    if (!Array.isArray(values)) {
      return []
    }
    return values.flatMap((sample: unknown) =>
      isObject(sample) && typeof sample.lang === 'string' && typeof sample.source === 'string'
        ? [
            {
              lang: sample.lang,
              source: sample.source,
              ...(typeof sample.label === 'string' ? { label: sample.label } : {}),
            },
          ]
        : [],
    )
  })
  const parameters = channel ? getChannelParameters(channel, operation) : undefined
  const servers = channel ? getAsyncApiServers(document, { channel, operation, pathParameters: parameters?.path }) : []
  const serverName = selectedServer ?? document['x-scalar-selected-server']
  const server = servers.find(({ name }) => name === serverName) ?? servers[0]
  return { operation, channel, messages: resolvedMessages, samples, server }
}
