import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
  AsyncApiMessageObject,
  AsyncApiMessageTraitObject,
  AsyncApiOperationObject,
  AsyncApiOperationTraitObject,
} from '@scalar/types/asyncapi/3.1'
import { resolveOperationWithTraits } from '@scalar/workspace-store/channel-example'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import type { TraversedAsyncApiComponent, TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'

import { resolveMessageTraits } from './resolve-message-traits'

/** Resolve one entry of a reusable component map, ignoring Reference Object siblings. */
const resolveComponent = <Key extends 'messages' | 'messageTraits' | 'operationTraits'>(
  document: AsyncApiDocument,
  componentType: Key,
  name: string,
) => {
  const components = document.components ? getResolvedAsyncApiRef(document.components) : undefined
  const node = components?.[componentType]?.[name]
  return node ? getResolvedAsyncApiRef(node) : undefined
}

/** Resolve a reusable message from `components.messages`, with its traits applied. */
const resolveAsyncApiComponentMessage = (
  document: AsyncApiDocument,
  name: string,
): AsyncApiMessageObject | undefined => {
  const message = resolveComponent(document, 'messages', name) as AsyncApiMessageObject | undefined
  return message ? resolveMessageTraits(message) : undefined
}

/** Resolve a reusable message trait from `components.messageTraits`. */
const resolveAsyncApiMessageTrait = (
  document: AsyncApiDocument,
  name: string,
): AsyncApiMessageTraitObject | undefined =>
  resolveComponent(document, 'messageTraits', name) as AsyncApiMessageTraitObject | undefined

/** Resolve a reusable operation trait from `components.operationTraits`. */
export const resolveAsyncApiOperationTrait = (
  document: AsyncApiDocument,
  name: string,
): AsyncApiOperationTraitObject | undefined =>
  resolveComponent(document, 'operationTraits', name) as AsyncApiOperationTraitObject | undefined

/**
 * Resolve whatever a message accordion displays: a channel message, a reusable message, or a message
 * trait. A message trait carries the message fields other than `payload` and `traits`, so it renders
 * through the same accordion.
 */
export const resolveAsyncApiMessageEntry = (
  document: AsyncApiDocument,
  entry: TraversedAsyncApiMessage | TraversedAsyncApiComponent,
): AsyncApiMessageObject | undefined => {
  if (entry.type === 'asyncapi-message') {
    return resolveAsyncApiMessage(document, entry.channelName, entry.messageName)
  }
  if (entry.componentType === 'messages') {
    return resolveAsyncApiComponentMessage(document, entry.name)
  }
  if (entry.componentType === 'messageTraits') {
    // Every message trait field is also a message field, so the trait is a valid partial message.
    return resolveAsyncApiMessageTrait(document, entry.name) as AsyncApiMessageObject | undefined
  }
  return undefined
}

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
