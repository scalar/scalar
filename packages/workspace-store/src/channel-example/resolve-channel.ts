import type { AsyncApiChannelObject, AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'

export type ResolvedChannel = {
  channelName: string
  channel: AsyncApiChannelObject
  channelAddress: string
}

/**
 * Resolves a channel by its key in `document.channels`.
 */
export const resolveChannel = (document: AsyncApiDocument, channelName: string): ResolvedChannel | undefined => {
  const channelNode = document.channels?.[channelName]
  if (!channelNode) {
    return undefined
  }

  const channel = getResolvedRef(channelNode, mergeSiblingReferences)
  const channelAddress =
    typeof channel.address === 'string' && channel.address.length > 0 ? channel.address : channelName

  return { channelName, channel, channelAddress }
}
