import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { AsyncApiChannelObject, AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'

import type { ChannelMessageEntry } from './get-channel-messages'

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
      const message = getResolvedRef(messageRef, mergeSiblingReferences)
      return { name, message }
    })
    .filter((entry): entry is ChannelMessageEntry => entry.message != null)
}
