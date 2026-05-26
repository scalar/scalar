import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AsyncApiChannelObject, AsyncApiDocument, AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'

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
