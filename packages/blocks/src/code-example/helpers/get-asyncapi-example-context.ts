import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
  AsyncApiMessageObject,
  AsyncApiOperationObject,
} from '@scalar/types/asyncapi/3.1'
import {
  type ChannelMessageEntry,
  getAllChannelMessages,
  resolveOperationChannel,
  resolveOperationWithTraits,
} from '@scalar/workspace-store/channel-example'
import { getNameFromRef } from '@scalar/workspace-store/helpers/get-name-from-ref'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import { resolveTraits } from '@scalar/workspace-store/helpers/resolve-traits'

type AsyncApiExampleContext = {
  operation: AsyncApiOperationObject
  channelName: string | undefined
  channel: AsyncApiChannelObject | undefined
  messages: ChannelMessageEntry[]
}

/** Resolve operation-level samples and only the messages that operation permits. */
export const getAsyncApiExampleContext = (
  document: AsyncApiDocument,
  operationName: string,
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
          const name =
            ref.$ref && resolved?.channelName
              ? getNameFromRef(ref.$ref, ['channels', resolved.channelName, 'messages'])
              : undefined
          return message && !('$ref' in message) ? [{ name: name ?? ref.$ref ?? String(index), message }] : []
        })
  const resolvedMessages = messages.map(({ name, message }) => ({
    name,
    message: resolveTraits(message, message.traits ?? []) satisfies AsyncApiMessageObject,
  }))
  return { operation, channelName: resolved?.channelName, channel, messages: resolvedMessages }
}
