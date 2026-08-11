import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AsyncApiChannelObject, AsyncApiDocument, AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'

import type { ChannelOperationSummary } from '@/channel-example/get-channel-operations'
import { getNameFromRef } from '@/helpers/get-name-from-ref'
import { getResolvedRef } from '@/helpers/get-resolved-ref'

export type ChannelMessageEntry = {
  name: string
  message: AsyncApiMessageObject
}

/**
 * Resolves every message defined on a channel (AsyncAPI data store for payloads).
 */
export const getAllChannelMessages = (
  _document: AsyncApiDocument,
  channel: AsyncApiChannelObject,
): ChannelMessageEntry[] => {
  if (!channel.messages) {
    return []
  }

  return objectEntries(channel.messages)
    .map(([name, messageRef]) => {
      const message = getResolvedRef(messageRef)
      return { name, message }
    })
    .filter((entry): entry is ChannelMessageEntry => entry.message != null)
}

/**
 * Resolves the messages that are valid outbound payloads for a channel.
 */
export const getSendChannelMessages = (
  document: AsyncApiDocument,
  channelName: string,
  channel: AsyncApiChannelObject,
  operations: ChannelOperationSummary[],
): ChannelMessageEntry[] => {
  const allMessages = getAllChannelMessages(document, channel)
  const sendOperations = operations.filter(({ action }) => action === 'send')

  if (!sendOperations.length) {
    return []
  }

  if (sendOperations.some(({ operation }) => operation.messages == null)) {
    return allMessages
  }

  const messagesByName = new Map(allMessages.map((entry) => [entry.name, entry]))
  const sendMessages = new Map<string, ChannelMessageEntry>()

  sendOperations.forEach(({ operation }) => {
    operation.messages?.forEach((messageRef) => {
      const messageName = getNameFromRef(messageRef.$ref, ['channels', channelName, 'messages'])
      const messageEntry =
        (messageName ? messagesByName.get(messageName) : undefined) ??
        allMessages.find(({ message }) => message === getResolvedRef(messageRef))

      if (messageEntry) {
        sendMessages.set(messageEntry.name, messageEntry)
      }
    })
  })

  return [...sendMessages.values()]
}
