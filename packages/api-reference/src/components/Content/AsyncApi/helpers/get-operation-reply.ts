import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { getNameFromRef } from '@scalar/workspace-store/helpers/get-name-from-ref'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isHidden } from '@scalar/workspace-store/helpers/is-hidden'
import type { XInternal } from '@scalar/workspace-store/schemas/extensions/document/x-internal'
import type { XScalarIgnore } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-ignore'
import type {
  TraversedAsyncApiMessage,
  TraversedDocument,
  TraversedEntry,
} from '@scalar/workspace-store/schemas/navigation'

import { pickHeading } from './pick-heading'
import { resolveAsyncApiChannel, resolveAsyncApiMessage } from './resolve-async-api-nodes'

/** Reply links point at existing content, which may live under a channel, operation, or tag. */
type ReplyLink = { title: string; id?: string }

/** The reply metadata shown beside the originating operation. */
export type OperationReply = {
  channel?: ReplyLink
  address?: string
  dynamicAddress: boolean
  description?: string
  messages: (ReplyLink & { entry?: TraversedAsyncApiMessage })[]
}

const findEntry = (
  entries: TraversedEntry[],
  matches: (entry: TraversedEntry) => boolean,
): TraversedEntry | undefined => {
  for (const entry of entries) {
    if (matches(entry)) {
      return entry
    }
    const child = 'children' in entry && entry.children ? findEntry(entry.children, matches) : undefined
    if (child) {
      return child
    }
  }
  return undefined
}

/** Resolve reply metadata and canonical navigation targets, respecting hidden content. */
export const getOperationReply = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject | undefined,
): OperationReply | undefined => {
  const reply = getResolvedRef(operation?.reply)
  if (!reply) {
    return undefined
  }
  const address = getResolvedRef(reply.address)
  const channelRef = reply.channel
  const referencedChannel = getResolvedRef(channelRef)
  const channelName = channelRef
    ? (getNameFromRef(channelRef.$ref, ['channels']) ??
      Object.keys(document.channels ?? {}).find(
        (name) => referencedChannel && getResolvedRef(document.channels?.[name]) === referencedChannel,
      ))
    : undefined
  const channel = channelName ? resolveAsyncApiChannel(document, channelName) : referencedChannel
  const navigation: TraversedDocument | undefined = document['x-scalar-navigation']
  const entries = navigation?.children ?? []
  const channelEntry = channelName
    ? findEntry(entries, (entry) => entry.type === 'asyncapi-channel' && entry.channelName === channelName)
    : undefined

  // Hidden channels must not leak their addresses or messages through another operation.
  if (
    (channel && isHidden(channel as XInternal & XScalarIgnore)) ||
    (navigation && channelName && document.channels?.[channelName] && !channelEntry)
  ) {
    return undefined
  }
  const messages = (reply.messages ?? []).flatMap((reference): OperationReply['messages'] => {
    const name = channelName ? getNameFromRef(reference.$ref, ['channels', channelName, 'messages']) : undefined
    const message =
      name && channelName
        ? resolveAsyncApiMessage(document, channelName, name)
        : getResolvedRef(getResolvedRef(reference))
    if (message && isHidden(message as XInternal & XScalarIgnore)) {
      return []
    }
    const entry =
      name && channelName
        ? findEntry(
            entries,
            (candidate) =>
              candidate.type === 'asyncapi-message' &&
              candidate.channelName === channelName &&
              candidate.messageName === name,
          )
        : undefined
    // Navigation also suppresses messages exclusively owned by hidden operations.
    if (navigation && channelEntry && name && channel?.messages?.[name] && !entry) {
      return []
    }
    return [
      {
        title: pickHeading(message?.title, message?.name, name ?? reference.$ref),
        id: entry?.id,
        entry: entry?.type === 'asyncapi-message' ? entry : undefined,
      },
    ]
  })

  return {
    channel: channelRef
      ? {
          title: pickHeading(channel?.title, channel?.address ?? undefined, channelName ?? channelRef.$ref),
          id: channelEntry?.id,
        }
      : undefined,
    address: address?.location ?? channel?.address ?? undefined,
    dynamicAddress: !!address?.location,
    description: address?.description,
    messages,
  }
}
