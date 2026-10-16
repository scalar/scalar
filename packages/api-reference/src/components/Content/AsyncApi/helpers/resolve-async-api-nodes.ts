import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
  AsyncApiMessageObject,
  AsyncApiOperationObject,
} from '@scalar/types/asyncapi/3.1'
import { resolveOperationWithTraits } from '@scalar/workspace-store/channel-example'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'

import { resolveMessageTraits } from './resolve-message-traits'

/**
 * Resolve a channel from the document by its `document.channels` key.
 *
 * AsyncAPI Reference Object siblings are ignored, including at intermediate hops.
 */
export const resolveAsyncApiChannel = (
  document: AsyncApiDocument,
  channelName: string,
): AsyncApiChannelObject | undefined => {
  const node = document.channels?.[channelName]
  return node ? getResolvedAsyncApiRef(node) : undefined
}

/**
 * Resolve a message from the channel it lives on. The navigation entry only carries the identifying
 * keys, so we walk `document.channels[channelName].messages[messageName]`.
 */
export const resolveAsyncApiMessage = (
  document: AsyncApiDocument,
  channelName: string,
  messageName: string,
): AsyncApiMessageObject | undefined => {
  const channel = resolveAsyncApiChannel(document, channelName)
  const node = channel?.messages?.[messageName]
  const message = getResolvedAsyncApiRef(node)
  return message ? resolveMessageTraits(message) : undefined
}

/**
 * Resolve an operation from the document by its `document.operations` key.
 *
 * Operation traits are merged in (matching the channel connection UI) so trait-only fields render
 * as part of the operation.
 */
export const resolveAsyncApiOperation = (
  document: AsyncApiDocument,
  operationName: string,
): AsyncApiOperationObject | undefined => {
  const node = document.operations?.[operationName]
  if (!node) {
    return undefined
  }
  const resolved = getResolvedAsyncApiRef(node)
  if (!resolved) {
    return undefined
  }
  const operation = resolveOperationWithTraits(resolved)
  // The workspace resolver handles connection fields; rendering and search also need trait prose.
  const metadata = operation.traits?.reduce<Pick<AsyncApiOperationObject, 'title' | 'summary' | 'description'>>(
    (inherited, traitNode) => {
      const trait = getResolvedAsyncApiRef(traitNode)
      return {
        ...inherited,
        ...(trait && Object.hasOwn(trait, 'title') ? { title: trait.title } : {}),
        ...(trait && Object.hasOwn(trait, 'summary') ? { summary: trait.summary } : {}),
        ...(trait && Object.hasOwn(trait, 'description') ? { description: trait.description } : {}),
      }
    },
    {},
  )
  return { ...metadata, ...operation }
}
