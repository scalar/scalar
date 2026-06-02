import { sortByOrder } from '@scalar/helpers/array/sort-by-order'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import type { AsyncApiChannelObject, AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import { isHidden } from '@/helpers/is-hidden'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { type NavigationOptions, getNavigationOptions } from '@/navigation/get-navigation-options'
import { getTag } from '@/navigation/helpers/get-tag'
import { traverseDescription } from '@/navigation/helpers/traverse-description'
import { traverseSchemas } from '@/navigation/helpers/traverse-schemas'
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
import type { OpenApiDocument, TagObject } from '@/schemas/v3.1/strict/openapi-document'

/** Anything that may carry the navigation visibility extensions. */
type Hideable = XInternal & XScalarIgnore

/** AsyncAPI document plus Scalar navigation extensions written during traversal. */
type AsyncApiDocumentWithNavigationExtensions = AsyncApiDocument & {
  'x-scalar-order'?: string[]
  'x-scalar-icon'?: string
}

/** Minimal message fields used when choosing a sidebar title. */
type AsyncApiMessageLike = {
  title?: string
  summary?: string
  name?: string
}

/** One tag on a channel or operation — inline object or `$ref` wrapper. */
type AsyncApiTagEntry = NonNullable<AsyncApiChannelObject['tags']>[number]

/**
 * One operation collected during the first pass, before navigation entries are built.
 *
 * Operation-level tags are intentionally not collected here yet — only channel-level tags
 * drive the sidebar grouping for now.
 */
type OperationBucketEntry = {
  operationName: string
  operation: AsyncApiOperationObject
}

/**
 * Working set for a single channel while the document is traversed.
 * Operations and tags are grouped here first, then turned into sidebar entries.
 */
type ChannelBucket = {
  channelName: string
  channel: AsyncApiChannelObject
  channelAddress: string
  channelTags: TagObject[]
  operations: OperationBucketEntry[]
}

/**
 * Picks the first display candidate that is non-empty after trimming.
 * Used by title helpers so we prefer `title`, then `summary`, then a fallback.
 */
const pickNonEmpty = (...candidates: Array<string | undefined>): string | undefined => {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed) {
      return trimmed
    }
  }
  return undefined
}

/**
 * Returns the channel address shown in the sidebar and routing.
 * Falls back to the channel map key when `channel.address` is missing or empty.
 */
const getChannelAddress = (channelName: string, channel: AsyncApiChannelObject): string =>
  typeof channel.address === 'string' && channel.address.length > 0 ? channel.address : channelName

/**
 * Sidebar label for a channel: `title`, then `summary`, then the resolved address.
 */
const getChannelTitle = (channel: AsyncApiChannelObject, channelName: string): string =>
  pickNonEmpty(channel.title, channel.summary) ?? getChannelAddress(channelName, channel)

/**
 * Sidebar label for an operation: `title`, then `summary`, then the operation map key.
 */
const getOperationTitle = (operation: AsyncApiOperationObject, operationName: string): string =>
  pickNonEmpty(operation.title, operation.summary) ?? operationName

/**
 * Sidebar label for a message: `title`, then `summary`, then `name`, then the message map key.
 */
const getMessageTitle = (message: AsyncApiMessageLike, messageName: string): string =>
  pickNonEmpty(message.title, message.summary, message.name) ?? messageName

/**
 * Parses a channel JSON pointer (`#/channels/<name>`) into the key used in `document.channels`.
 */
const getChannelNameFromRef = (ref: string): string | undefined => ref.match(/^#\/channels\/([^/]+)$/)?.[1]

/**
 * Resolves the channel referenced by an operation.
 *
 * The AsyncAPI 3 spec requires `operation.channel` to be a Reference Object,
 * so we read the channel key straight from the JSON pointer rather than trying
 * to match against the resolved channel by identity.
 */
const resolveOperationChannel = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
): { channelName: string; channel: AsyncApiChannelObject } | undefined => {
  const channelRef = operation.channel
  if (!channelRef || !('$ref' in channelRef)) {
    return undefined
  }

  const channelName = getChannelNameFromRef(channelRef.$ref)
  if (!channelName) {
    return undefined
  }

  const channelEntry = document.channels?.[channelName]
  if (!channelEntry) {
    return undefined
  }

  return {
    channelName,
    channel: getResolvedRef(channelEntry, mergeSiblingReferences),
  }
}

/**
 * Resolves which channel message names an operation references.
 *
 * - `operation.messages === undefined` → every channel message is included.
 * - `operation.messages === []` → no channel messages are included.
 * - Otherwise → the channel messages that the operation explicitly references.
 */
const resolveOperationMessageNames = (
  operation: AsyncApiOperationObject,
  channel: AsyncApiChannelObject,
  channelName: string,
): string[] => {
  const channelMessages = channel.messages ?? {}

  if (operation.messages === undefined) {
    return objectKeys(channelMessages)
  }

  if (operation.messages.length === 0) {
    return []
  }

  const channelScopePrefix = `#/channels/${channelName}/messages/`
  const names = new Set<string>()

  for (const messageRef of operation.messages) {
    if (!('$ref' in messageRef)) {
      continue
    }

    // Common case: a channel-scoped reference like `#/channels/<name>/messages/<id>`.
    if (messageRef.$ref.startsWith(channelScopePrefix)) {
      const candidate = messageRef.$ref.slice(channelScopePrefix.length)
      if (channelMessages[candidate]) {
        names.add(candidate)
        continue
      }
    }

    // Fallback: a channel-level message that points to the same target.
    for (const [name, entry] of Object.entries(channelMessages)) {
      if (entry && '$ref' in entry && entry.$ref === messageRef.$ref) {
        names.add(name)
      }
    }
  }

  return [...names]
}

/**
 * Normalizes an AsyncAPI tag (inline object or `$ref`) into the OpenAPI-style `TagObject`
 * used by the shared tag navigation helpers.
 */
const toTagObject = (tag: AsyncApiTagEntry): TagObject => {
  const resolved = getResolvedRef(tag, mergeSiblingReferences)
  return {
    name: resolved.name,
    description: resolved.description,
  }
}

/**
 * Sorts operation navigation entries in place using the workspace `operationsSorter` option.
 * Maps AsyncAPI `action` to the HTTP-style sorter fields so OpenAPI and AsyncAPI share the same API.
 */
const sortOperations = (
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

/** Sorts message navigation entries alphabetically by display title. */
const sortMessages = (entries: TraversedAsyncApiMessage[]): void => {
  entries.sort((a, b) => a.title.localeCompare(b.title))
}

/**
 * Builds nested message entries for one operation.
 * Resolves each message ref, skips hidden messages, and sorts the result by title.
 */
const createMessageEntries = ({
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
  const messages = messageNames.flatMap((messageName): TraversedAsyncApiMessage[] => {
    const messageNode = channel.messages?.[messageName]
    if (!messageNode) {
      return []
    }

    const message = getResolvedRef(messageNode, mergeSiblingReferences)
    if (isHidden(message as Hideable)) {
      return []
    }

    return [
      {
        type: 'asyncapi-message',
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

  sortMessages(messages)
  return messages
}

/**
 * Builds a single operation navigation entry under a channel.
 * Includes nested messages when the operation references channel messages (or all of them by default).
 * Returns `undefined` when the operation is hidden via `x-internal` or `x-scalar-ignore`.
 */
const createOperationEntry = ({
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
  if (isHidden(operation as Hideable)) {
    return undefined
  }

  const operationId = generateId({
    type: 'asyncapi-operation',
    operationName,
    parentId,
  })

  const messageEntries = createMessageEntries({
    channelName,
    channel,
    operationId,
    messageNames: resolveOperationMessageNames(operation, channel, channelName),
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

/**
 * Builds a channel navigation entry from a bucket and the operations to render under it.
 * The same channel may appear at the document root and under each of its channel-level tags.
 * Writes `x-scalar-order` on the source channel (when it is not a bare `$ref`) so other code can reuse the order.
 * Returns `undefined` when the channel is hidden or every requested operation was filtered out.
 */
const createChannelEntry = ({
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
  if (isHidden(bucket.channel as Hideable)) {
    return undefined
  }

  const channelId = generateId({
    type: 'asyncapi-channel',
    channelName: bucket.channelName,
    parentId,
    parentTag,
  })

  const operations = operationEntries.flatMap(({ operationName, operation }) => {
    const entry = createOperationEntry({
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

  sortOperations(operations, operationsSorter)

  if (operations.length === 0) {
    return undefined
  }

  // Persist the rendered order back onto the source channel for downstream consumers.
  // We skip channels that are stored as references, since the order should live on the target.
  const channelNode = document.channels?.[bucket.channelName]
  if (channelNode && !('$ref' in channelNode)) {
    ;(channelNode as AsyncApiChannelObject & { 'x-scalar-order'?: string[] })['x-scalar-order'] = operations.map(
      (child) => child.id,
    )
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

/**
 * Wraps collected channel entries in a tag navigation node.
 * Persists child order on the tag via `x-scalar-order` for later reordering in the UI.
 */
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

/**
 * Turns the in-memory `tagsMap` into top-level tag navigation entries.
 * Respects per-tag `x-scalar-order`, document-level `x-scalar-order`, and `tagsSorter` (alpha or custom).
 * Skips tags marked hidden.
 */
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

    const tagOrder = tag['x-scalar-order']

    return createTagEntry({
      tag,
      generateId,
      children: tagOrder ? sortByOrder(tagEntries, tagOrder, (item) => item.id) : tagEntries,
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

/**
 * Returns the existing bucket for a channel name or creates one with address and channel-level tags.
 * Buckets are shared across the traversal so operations on the same channel accumulate together.
 */
const getOrCreateChannelBucket = (
  channelBuckets: Map<string, ChannelBucket>,
  channelName: string,
  channel: AsyncApiChannelObject,
): ChannelBucket => {
  const existing = channelBuckets.get(channelName)
  if (existing) {
    return existing
  }

  const bucket: ChannelBucket = {
    channelName,
    channel,
    channelAddress: getChannelAddress(channelName, channel),
    channelTags: channel.tags?.map(toTagObject) ?? [],
    operations: [],
  }

  channelBuckets.set(channelName, bucket)
  return bucket
}

/**
 * Builds the channel/operation registry used to drive the rest of the traversal.
 *
 * Channels are seeded first so that they can appear in the sidebar even when no
 * operations reference them. Operations are then assigned to the bucket of the
 * channel they reference; operations with no resolvable channel are skipped.
 */
const collectChannelBuckets = (document: AsyncApiDocument): Map<string, ChannelBucket> => {
  const channelBuckets = new Map<string, ChannelBucket>()

  for (const [channelName, channelNode] of Object.entries(document.channels ?? {})) {
    if (!channelNode) {
      continue
    }

    const channel = getResolvedRef(channelNode, mergeSiblingReferences)
    if (isHidden(channel as Hideable)) {
      continue
    }

    getOrCreateChannelBucket(channelBuckets, channelName, channel)
  }

  for (const [operationName, operationNode] of Object.entries(document.operations ?? {})) {
    if (!operationNode) {
      continue
    }

    const operation = getResolvedRef(operationNode, mergeSiblingReferences)
    if (isHidden(operation as Hideable)) {
      continue
    }

    const resolved = resolveOperationChannel(document, operation)
    if (!resolved) {
      continue
    }

    const bucket = getOrCreateChannelBucket(channelBuckets, resolved.channelName, resolved.channel)

    // Operation-level tags are deliberately ignored here. Tag grouping is driven by
    // channel-level tags only until operation-tag grouping is reintroduced.
    bucket.operations.push({
      operationName,
      operation,
    })
  }

  return channelBuckets
}

/**
 * Entry point: walks an AsyncAPI document and produces the sidebar tree.
 *
 * High-level flow:
 * 1. `collectChannelBuckets` — resolve refs, group operations by channel, collect channel tags.
 * 2. For each bucket — build the channel entry at the document root with all of its operations.
 * 3. Apply channel-level tags so a channel can also appear under each of its tags.
 * 4. Sort tags and top-level entries, then persist `x-scalar-order` on the document for stable ordering.
 *
 * Operation-level tags are intentionally not used to group channels yet; only channel-level
 * tags drive tag grouping.
 */
export const traverseAsyncApiDocument = (
  documentName: string,
  document: AsyncApiDocumentWithNavigationExtensions,
  options?: NavigationOptions,
): TraversedDocument => {
  const { generateId, operationsSorter, tagsSorter, hideModels, modelsSectionLabel } = getNavigationOptions(
    documentName,
    options,
  )

  const documentId = generateId({
    type: 'document',
    info: document.info,
    name: documentName,
  })

  const channelBuckets = collectChannelBuckets(document)
  const tagsMap: TagsMap = new Map()
  const untaggedChannels: TraversedAsyncApiChannel[] = []

  for (const bucket of channelBuckets.values()) {
    // Operation-level tags are intentionally skipped for now: every operation is rendered
    // under its channel, and only the channel's own tags drive tag grouping below.
    if (bucket.channelTags.length === 0) {
      const untaggedChannel = createChannelEntry({
        bucket,
        operationEntries: bucket.operations,
        generateId,
        parentId: documentId,
        operationsSorter,
        document,
      })

      if (untaggedChannel) {
        untaggedChannels.push(untaggedChannel)
      }
    }

    // Channels can declare their own tags independently of any operation tags.
    for (const tag of bucket.channelTags) {
      const tagName = tag.name ?? 'Untitled Tag'
      const { id: tagId, entries } = getTag({ tagsMap, name: tagName, documentId, generateId })

      const alreadyRegistered = entries.some(
        (entry) => entry.type === 'asyncapi-channel' && entry.channelName === bucket.channelName,
      )
      if (alreadyRegistered) {
        continue
      }

      const taggedChannel = createChannelEntry({
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

  // AsyncAPI documents carry reusable schemas under `components.schemas`, just like OpenAPI.
  // Reuse the OpenAPI schema traversal so they render as "Models" in the same way. Schemas
  // tagged via `x-tags` are pushed into `tagsMap` here, so this must run before the tag
  // entries below are built from that map.
  //
  // `traverseSchemas` only reads `components.schemas`, which both document shapes share, but it is
  // typed against the OpenAPI document. We hand it the resolved `components` (so a `$ref`-only
  // wrapper still exposes its schemas) wrapped in a minimal document; the cast bridges the single
  // overlapping field, since AsyncAPI and OpenAPI documents are otherwise distinct types.
  const components = document.components ? getResolvedRef(document.components, mergeSiblingReferences) : undefined
  const untaggedModels =
    !hideModels && components?.schemas
      ? traverseSchemas({ documentId, document: { components } as unknown as OpenApiDocument, generateId, tagsMap })
      : []

  // Surface the Introduction entry plus any headings extracted from `info.description`
  // before the channel/tag entries, mirroring how OpenAPI documents are traversed.
  const entries: TraversedEntry[] = traverseDescription({
    generateId,
    parentId: documentId,
    info: document.info,
  })

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

  // Mirror OpenAPI: untagged schemas are grouped under a single top-level "Models" section.
  if (untaggedModels.length) {
    entries.push({
      type: 'models',
      id: generateId({ type: 'model', parentId: documentId }),
      title: modelsSectionLabel,
      name: modelsSectionLabel,
      children: untaggedModels,
    })
  }

  const sortOrder = document['x-scalar-order']
  const orderedEntries = sortOrder ? sortByOrder(entries, sortOrder, (entry) => entry.id) : entries

  document['x-scalar-order'] = unpackProxyObject(orderedEntries.map((entry) => entry.id))

  return {
    id: documentId,
    type: 'document',
    title: document.info?.title?.trim() || 'Untitled Document',
    name: documentName,
    children: orderedEntries,
    icon: document['x-scalar-icon'],
  }
}
