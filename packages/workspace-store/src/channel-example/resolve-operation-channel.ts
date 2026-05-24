import type { AsyncApiChannelObject, AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef } from '@/helpers/get-resolved-ref'

export type ResolvedOperationChannel = {
  channelName: string
  channel: AsyncApiChannelObject
  channelAddress: string
}

const getChannelNameFromRef = (ref: string): string | undefined => {
  const match = ref.match(/^#\/channels\/(.+)$/)
  return match?.[1]
}

const findChannelName = (document: AsyncApiDocument, channel: AsyncApiChannelObject): string | undefined => {
  if (!document.channels) {
    return undefined
  }

  for (const [channelName, channelNode] of Object.entries(document.channels)) {
    const resolved = getResolvedRef(channelNode)
    if (resolved === channel) {
      return channelName
    }
  }

  return undefined
}

/**
 * Resolves an operation's channel reference to a channel name, object, and display address.
 */
export const resolveOperationChannel = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
): ResolvedOperationChannel | undefined => {
  const channelNode = getResolvedRef(operation.channel)
  if (!channelNode) {
    return undefined
  }

  const channelNameFromRef = '$ref' in channelNode ? getChannelNameFromRef(channelNode.$ref) : undefined

  if (channelNameFromRef && document.channels?.[channelNameFromRef]) {
    const channel = getResolvedRef(document.channels[channelNameFromRef])
    const channelAddress =
      typeof channel.address === 'string' && channel.address.length > 0 ? channel.address : channelNameFromRef

    return { channelName: channelNameFromRef, channel, channelAddress }
  }

  const channel = getResolvedRef(channelNode)
  const channelName =
    channelNameFromRef ??
    findChannelName(document, channel) ??
    (typeof channel.address === 'string' && channel.address.length > 0 ? channel.address : undefined)

  if (!channelName) {
    return undefined
  }

  const channelAddress =
    typeof channel.address === 'string' && channel.address.length > 0 ? channel.address : channelName

  return { channelName, channel, channelAddress }
}
