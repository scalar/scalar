import { sortByOrder } from '@scalar/helpers/array/sort-by-order'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import type { AsyncApiChannelObject, AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import { isHidden } from '@/helpers/is-hidden'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { type NavigationOptions, getNavigationOptions } from '@/navigation/get-navigation-options'
import { getTag } from '@/navigation/helpers/get-tag'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { XInternal } from '@/schemas/extensions/document/x-internal'
import type { XScalarIgnore } from '@/schemas/extensions/document/x-scalar-ignore'
import type {
  ParentTag,
  TraversedAsyncApiChannel,
  TraversedAsyncApiMessage,
  TraversedAsyncApiOperation,
  TraversedDocument,
  TraversedEntry,
  TraversedTag,
} from '@/schemas/navigation'
import type { InfoObject, TagObject } from '@/schemas/v3.1/strict/openapi-document'

type AsyncApiTagLike = {
  name: string
  description?: string
}

type OperationBucketEntry = {
  operationName: string
  operation: AsyncApiOperationObject
  tags: TagObject[]
}

type ChannelBucket = {
  channelName: string
  channel: AsyncApiChannelObject
  channelAddress: string
  channelTags: TagObject[]
  operations: OperationBucketEntry[]
}

type AsyncApiDocumentWithNavigationExtensions = AsyncApiDocument & {
  'x-scalar-order'?: string[]
  'x-scalar-icon'?: string
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
    const resolved = getResolvedRef(channelNode, mergeSiblingReferences)
    if (resolved === channel) {
      return channelName
    }
  }

  return undefined
}

const resolveChannelNode = (
  document: AsyncApiDocument,
  channelNode: AsyncApiOperationObject['channel'],
): { channelName: string; channel: AsyncApiChannelObject } | undefined => {
  if (!channelNode) {
    return undefined
  }

  const channelNameFromRef = '$ref' in channelNode ? getChannelNameFromRef(channelNode.$ref) : undefined

  if (channelNameFromRef && document.channels?.[channelNameFromRef]) {
    const channel = getResolvedRef(document.channels[channelNameFromRef], mergeSiblingReferences)
    return { channelName: channelNameFromRef, channel }
  }

  const channel = getResolvedRef(channelNode, mergeSiblingReferences) as AsyncApiChannelObject
  const channelName = channelNameFromRef ?? findChannelName(document, channel)

  if (!channelName) {
    return undefined
  }

  return { channelName, channel }
}

const getChannelAddress = (channelName: string, channel: AsyncApiChannelObject): string => {
  return typeof channel.address === 'string' && channel.address.length > 0 ? channel.address : channelName
}

const getChannelTitle = (channel: AsyncApiChannelObject, channelName: string): string => {
  if (channel.title?.trim()) {
    return channel.title.trim()
  }

  if (channel.summary?.trim()) {
    return channel.summary.trim()
  }

  return getChannelAddress(channelName, channel)
}

const getOperationTitle = (operation: AsyncApiOperationObject, operationName: string): string => {
  if (operation.title?.trim()) {
    return operation.title.trim()
  }

  if (operation.summary?.trim()) {
    return operation.summary.trim()
  }

  return operationName
}

type AsyncApiMessageLike = {
  title?: string
  summary?: string
  name?: string
}

const getMessageNameFromRef = (ref: string, channelName: string): string | undefined => {
  const channelMessageMatch = ref.match(new RegExp(`^#/channels/${channelName}/messages/(.+)$`))
  if (channelMessageMatch?.[1]) {
    return channelMessageMatch[1]
  }

  return undefined
}

/**
 * Resolves message keys for an operation.
 * Omit `operation.messages` → all channel messages; `[]` → none; refs → subset.
 */
const resolveOperationMessageNames = (
  operation: AsyncApiOperationObject,
  channel: AsyncApiChannelObject,
  channelName: string,
): string[] => {
  if (operation.messages !== undefined) {
    if (operation.messages.length === 0) {
      return []
    }

    const names = new Set<string>()

    for (const messageRef of operation.messages) {
      if ('$ref' in messageRef) {
        const fromRef = getMessageNameFromRef(messageRef.$ref, channelName)
        if (fromRef && channel.messages?.[fromRef]) {
          names.add(fromRef)
          continue
        }

        if (channel.messages) {
          for (const messageName of objectKeys(channel.messages)) {
            const messageNode = channel.messages[messageName]
            if (messageNode && '$ref' in messageNode && messageNode.$ref === messageRef.$ref) {
              names.add(messageName)
            }
          }
        }
      }
    }

    return [...names]
  }

  if (!channel.messages) {
    return []
  }

  return objectKeys(channel.messages)
}

const getMessageTitle = (message: AsyncApiMessageLike, messageName: string): string => {
  if (message.title?.trim()) {
    return message.title.trim()
  }

  if (message.summary?.trim()) {
    return message.summary.trim()
  }

  if (message.name?.trim()) {
    return message.name.trim()
  }

  return messageName
}

const toTagObject = (tag: AsyncApiTagLike): TagObject => {
  const resolved = getResolvedRef(tag, mergeSiblingReferences)
  return {
    name: resolved.name,
    description: resolved.description,
  }
}

const sortAsyncApiOperations = (
  entries: TraversedAsyncApiOperation[],
  operationsSorter: TraverseSpecOptions['operationsSorter'],
): void => {
  if (operationsSorter === 'alpha') {
    entries.sort((a, b) => a.title.localeCompare(b.title))
    return
  }

  if (operationsSorter === 'method') {
    entries.sort((a, b) => a.action.localeCompare(b.action))
    return
  }

  if (typeof operationsSorter === 'function') {
    entries.sort((a, b) =>
      operationsSorter(
        { method: a.action, path: a.operationName, ref: a.operationName, httpVerb: a.action },
        { method: b.action, path: b.operationName, ref: b.operationName, httpVerb: b.action },
      ),
    )
  }
}

const sortAsyncApiMessages = (entries: TraversedAsyncApiMessage[]): void => {
  entries.sort((a, b) => a.title.localeCompare(b.title))
}

const createAsyncApiMessageEntries = ({
  channelName,
  channel,
  operationId,
  messageNames,
  generateId,
}: {
  channelName: string
  channel: AsyncApiChannelObject
  operationId: string
  messageNames: string[]
  generateId: TraverseSpecOptions['generateId']
}): TraversedAsyncApiMessage[] => {
  const messages = messageNames.flatMap((messageName) => {
    const messageNode = channel.messages?.[messageName]
    if (!messageNode) {
      return []
    }

    const message = getResolvedRef(messageNode, mergeSiblingReferences)

    if (isHidden(message as XInternal & XScalarIgnore)) {
      return []
    }

    return [
      {
        type: 'asyncapi-message' as const,
        id: generateId({
          type: 'asyncapi-message',
          messageName,
          channelName,
          parentId: operationId,
        }),
        title: getMessageTitle(message, messageName),
        messageName,
        channelName,
      },
    ]
  })

  sortAsyncApiMessages(messages)
  return messages
}

const createAsyncApiOperationEntry = ({
  operationName,
  operation,
  channel,
  channelName,
  channelAddress,
  generateId,
  parentId,
}: {
  operationName: string
  operation: AsyncApiOperationObject
  channel: AsyncApiChannelObject
  channelName: string
  channelAddress: string
  generateId: TraverseSpecOptions['generateId']
  parentId: string
}): TraversedAsyncApiOperation | undefined => {
  if (isHidden(operation as XInternal & XScalarIgnore)) {
    return undefined
  }

  const operationId = generateId({
    type: 'asyncapi-operation',
    operationName,
    parentId,
  })

  const messageNames = resolveOperationMessageNames(operation, channel, channelName)
  const messageEntries = createAsyncApiMessageEntries({
    channelName,
    channel,
    operationId,
    messageNames,
    generateId,
  })

  return {
    type: 'asyncapi-operation',
    id: operationId,
    title: getOperationTitle(operation, operationName),
    operationName,
    action: operation.action,
    channelName,
    channelAddress,
    children: messageEntries.length > 0 ? messageEntries : undefined,
  }
}

const createAsyncApiChannelEntry = ({
  bucket,
  operationEntries,
  generateId,
  parentId,
  parentTag,
  operationsSorter,
  document,
}: {
  bucket: ChannelBucket
  operationEntries: OperationBucketEntry[]
  generateId: TraverseSpecOptions['generateId']
  parentId: string
  parentTag?: ParentTag
  operationsSorter: TraverseSpecOptions['operationsSorter']
  document: AsyncApiDocument
}): TraversedAsyncApiChannel | undefined => {
  if (isHidden(bucket.channel as XInternal & XScalarIgnore)) {
    return undefined
  }

  const channelId = generateId({
    type: 'asyncapi-channel',
    channelName: bucket.channelName,
    parentId,
    parentTag,
  })

  const operations = operationEntries.flatMap(({ operationName, operation }) => {
    const entry = createAsyncApiOperationEntry({
      operationName,
      operation,
      channel: bucket.channel,
      channelName: bucket.channelName,
      channelAddress: bucket.channelAddress,
      generateId,
      parentId: channelId,
    })

    return entry ? [entry] : []
  })

  sortAsyncApiOperations(operations, operationsSorter)

  if (operations.length === 0) {
    return undefined
  }

  const channelNode = document.channels?.[bucket.channelName]
  if (channelNode && typeof channelNode === 'object' && !('$ref' in channelNode)) {
    const channelWithOrder = channelNode as AsyncApiChannelObject & { 'x-scalar-order'?: string[] }
    channelWithOrder['x-scalar-order'] = operations.map((child) => child.id)
  }

  return {
    type: 'asyncapi-channel',
    id: channelId,
    title: getChannelTitle(bucket.channel, bucket.channelName),
    channelName: bucket.channelName,
    channelAddress: bucket.channelAddress,
    children: operations,
  }
}

const createTagEntry = ({
  tag,
  generateId,
  children,
  parentId,
}: {
  tag: TagObject
  generateId: TraverseSpecOptions['generateId']
  children: TraversedEntry[]
  parentId: string
}): TraversedTag => {
  const id = generateId({
    type: 'tag',
    tag,
    parentId,
    isGroup: false,
  })
  const title = tag['x-displayName'] ?? tag.name ?? 'Untitled Tag'

  tag['x-scalar-order'] = children.map((child) => child.id)

  return {
    type: 'tag',
    id,
    title,
    name: tag.name || title,
    description: tag.description,
    children,
    isGroup: false,
    isWebhooks: false,
  }
}

const getSortedTagEntries = ({
  tagKeys,
  tagsMap,
  documentId,
  options: { tagsSorter, generateId },
  sortOrder,
}: {
  tagKeys: string[]
  tagsMap: TagsMap
  documentId: string
  options: Pick<TraverseSpecOptions, 'tagsSorter' | 'generateId'>
  sortOrder: string[] | undefined
}): TraversedTag[] => {
  const entries = tagKeys.flatMap((key) => {
    const { tag, entries: tagEntries } = getTag({ tagsMap, name: key, documentId, generateId })

    if (isHidden(tag)) {
      return []
    }

    const sortOrder = tag['x-scalar-order']

    return createTagEntry({
      tag,
      generateId,
      children: sortOrder ? sortByOrder(tagEntries, sortOrder, (item) => item.id) : tagEntries,
      parentId: documentId,
    })
  })

  if (sortOrder) {
    return sortByOrder(entries, sortOrder, (item) => item.id)
  }

  if (tagsSorter === 'alpha') {
    entries.sort((a, b) => a.title.localeCompare(b.title))
  } else if (typeof tagsSorter === 'function') {
    entries.sort((a, b) =>
      tagsSorter(
        getTag({ tagsMap, name: a.name, documentId, generateId }).tag,
        getTag({ tagsMap, name: b.name, documentId, generateId }).tag,
      ),
    )
  }

  return entries
}

const getOrCreateChannelBucket = ({
  channelBuckets,
  channelName,
  channel,
}: {
  channelBuckets: Map<string, ChannelBucket>
  channelName: string
  channel: AsyncApiChannelObject
}): ChannelBucket => {
  const existing = channelBuckets.get(channelName)
  if (existing) {
    return existing
  }

  const bucket: ChannelBucket = {
    channelName,
    channel,
    channelAddress: getChannelAddress(channelName, channel),
    channelTags: channel.tags?.map((tag) => toTagObject(getResolvedRef(tag, mergeSiblingReferences))) ?? [],
    operations: [],
  }

  channelBuckets.set(channelName, bucket)
  return bucket
}

/**
 * Traverses an AsyncAPI document to generate sidebar navigation for channels,
 * operations, and operation messages.
 */
export const traverseAsyncApiDocument = (
  documentName: string,
  document: AsyncApiDocumentWithNavigationExtensions,
  options?: NavigationOptions,
): TraversedDocument => {
  const { generateId, operationsSorter, tagsSorter } = getNavigationOptions(documentName, options)

  const documentId = generateId({
    type: 'document',
    info: document.info as InfoObject,
    name: documentName,
  })

  const channelBuckets = new Map<string, ChannelBucket>()

  if (document.channels) {
    for (const channelName of objectKeys(document.channels)) {
      const channelNode = document.channels[channelName]
      if (!channelNode) {
        continue
      }

      const channel = getResolvedRef(channelNode, mergeSiblingReferences)
      if (isHidden(channel as XInternal & XScalarIgnore)) {
        continue
      }

      getOrCreateChannelBucket({ channelBuckets, channelName, channel })
    }
  }

  if (document.operations) {
    for (const operationName of objectKeys(document.operations)) {
      const operationNode = document.operations[operationName]
      if (!operationNode) {
        continue
      }

      const operation = getResolvedRef(operationNode, mergeSiblingReferences)
      if (isHidden(operation as XInternal & XScalarIgnore)) {
        continue
      }

      const resolvedChannel = resolveChannelNode(document, operation.channel)
      if (!resolvedChannel) {
        continue
      }

      const { channelName, channel } = resolvedChannel
      const bucket = getOrCreateChannelBucket({ channelBuckets, channelName, channel })

      const operationTags = operation.tags?.map((tag) => toTagObject(getResolvedRef(tag, mergeSiblingReferences))) ?? []

      bucket.operations.push({
        operationName,
        operation,
        tags: operationTags,
      })
    }
  }

  const tagsMap: TagsMap = new Map()
  const untaggedChannels: TraversedAsyncApiChannel[] = []

  for (const bucket of channelBuckets.values()) {
    const untaggedOperations = bucket.operations.filter((entry) => entry.tags.length === 0)
    const taggedOperations = bucket.operations.filter((entry) => entry.tags.length > 0)

    const untaggedChannel = createAsyncApiChannelEntry({
      bucket,
      operationEntries: untaggedOperations,
      generateId,
      parentId: documentId,
      operationsSorter,
      document,
    })

    if (untaggedChannel) {
      untaggedChannels.push(untaggedChannel)
    }

    for (const operationEntry of taggedOperations) {
      for (const tag of operationEntry.tags) {
        const tagName = tag.name ?? 'Untitled Tag'
        const tagObject = toTagObject(tag)
        const { id: tagId } = getTag({ tagsMap, name: tagName, documentId, generateId })
        const parentTag: ParentTag = { tag: tagObject, id: tagId }

        const taggedChannel = createAsyncApiChannelEntry({
          bucket,
          operationEntries: [operationEntry],
          generateId,
          parentId: tagId,
          parentTag,
          operationsSorter,
          document,
        })

        if (!taggedChannel) {
          continue
        }

        const { entries } = getTag({ tagsMap, name: tagName, documentId, generateId })
        const existingChannel = entries.find(
          (entry): entry is TraversedAsyncApiChannel =>
            entry.type === 'asyncapi-channel' && entry.channelName === bucket.channelName,
        )

        if (existingChannel) {
          const mergedOperations = [
            ...(existingChannel.children ?? []).filter(
              (child): child is TraversedAsyncApiOperation => child.type === 'asyncapi-operation',
            ),
            ...(taggedChannel.children ?? []).filter(
              (child): child is TraversedAsyncApiOperation => child.type === 'asyncapi-operation',
            ),
          ]
          const uniqueOperations = new Map(mergedOperations.map((operation) => [operation.operationName, operation]))
          const mergedChannelOperations = [...uniqueOperations.values()]

          sortAsyncApiOperations(mergedChannelOperations, operationsSorter)
          existingChannel.children = mergedChannelOperations
          continue
        }

        entries.push(taggedChannel)
      }
    }

    for (const tag of bucket.channelTags) {
      const tagName = tag.name ?? 'Untitled Tag'
      const { id: tagId, entries } = getTag({ tagsMap, name: tagName, documentId, generateId })

      if (entries.some((entry) => entry.type === 'asyncapi-channel' && entry.channelName === bucket.channelName)) {
        continue
      }

      const taggedChannel = createAsyncApiChannelEntry({
        bucket,
        operationEntries: bucket.operations,
        generateId,
        parentId: tagId,
        parentTag: { tag, id: tagId },
        operationsSorter,
        document,
      })

      if (taggedChannel) {
        entries.push(taggedChannel)
      }
    }
  }

  const entries: TraversedEntry[] = []

  if (tagsMap.size > 0) {
    entries.push(
      ...getSortedTagEntries({
        tagKeys: [...tagsMap.keys()],
        tagsMap,
        documentId,
        options: { tagsSorter, generateId },
        sortOrder: document['x-scalar-order'],
      }),
    )
  }

  if (operationsSorter === 'alpha') {
    untaggedChannels.sort((a, b) => a.title.localeCompare(b.title))
  }

  entries.push(...untaggedChannels)

  const sortOrder = document['x-scalar-order']

  if (sortOrder) {
    entries.sort((a, b) => {
      const indexA = sortOrder.indexOf(a.id)
      const indexB = sortOrder.indexOf(b.id)
      const safeIndexA = indexA === -1 ? Number.POSITIVE_INFINITY : indexA
      const safeIndexB = indexB === -1 ? Number.POSITIVE_INFINITY : indexB
      return safeIndexA - safeIndexB
    })
  }

  document['x-scalar-order'] = unpackProxyObject(entries.map((entry) => entry.id))

  const documentTitle = document.info?.title?.trim() || 'Untitled Document'

  return {
    id: documentId,
    type: 'document',
    title: documentTitle,
    name: documentName,
    children: entries,
    icon: document['x-scalar-icon'],
  }
}
