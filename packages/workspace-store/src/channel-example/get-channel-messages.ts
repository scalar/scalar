import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
  AsyncApiMessageObject,
  AsyncApiOperationObject,
} from '@scalar/types/asyncapi/3.1'

import { getAllChannelMessages } from '@/channel-example/get-all-channel-messages'
import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'

export type ChannelMessageEntry = {
  name: string
  message: AsyncApiMessageObject
}

const getMessageNameFromRef = (ref: string): string | undefined => {
  const channelMessageMatch = ref.match(/^#\/channels\/[^/]+\/messages\/(.+)$/)
  if (channelMessageMatch?.[1]) {
    return channelMessageMatch[1]
  }

  const componentsMessageMatch = ref.match(/^#\/components\/messages\/(.+)$/)
  return componentsMessageMatch?.[1]
}

const resolveMessageByName = (
  document: AsyncApiDocument,
  channel: AsyncApiChannelObject,
  messageName: string,
): AsyncApiMessageObject | undefined => {
  const channelMessage = channel.messages?.[messageName]
  if (channelMessage) {
    return getResolvedRef(channelMessage, mergeSiblingReferences)
  }

  const components = document.components ? getResolvedRef(document.components, mergeSiblingReferences) : undefined
  const componentMessage = components?.messages?.[messageName]
  if (componentMessage) {
    return getResolvedRef(componentMessage, mergeSiblingReferences)
  }

  return undefined
}

const resolveMessageRef = (
  document: AsyncApiDocument,
  channel: AsyncApiChannelObject,
  messageRef: NonNullable<AsyncApiOperationObject['messages']>[number],
): ChannelMessageEntry | undefined => {
  const messageNameFromRef = '$ref' in messageRef ? getMessageNameFromRef(messageRef.$ref) : undefined
  const resolved = getResolvedRef(messageRef, mergeSiblingReferences) as AsyncApiMessageObject

  const messageName =
    messageNameFromRef ?? (typeof resolved.name === 'string' && resolved.name.length > 0 ? resolved.name : undefined)

  if (!messageName) {
    return undefined
  }

  const message = resolveMessageByName(document, channel, messageName) ?? resolved

  return { name: messageName, message }
}

/**
 * Resolves messages for an operation: explicit operation message refs, or all channel messages when omitted.
 */
export const getChannelMessages = (
  document: AsyncApiDocument,
  channel: AsyncApiChannelObject,
  operation: AsyncApiOperationObject,
): ChannelMessageEntry[] => {
  if (operation.messages != null) {
    if (operation.messages.length === 0) {
      return []
    }

    return operation.messages
      .map((messageRef) => resolveMessageRef(document, channel, messageRef))
      .filter((entry): entry is ChannelMessageEntry => entry != null)
  }

  return getAllChannelMessages(document, channel)
}
