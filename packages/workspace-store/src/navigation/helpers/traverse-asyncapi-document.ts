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
  TraversedAsyncApiOperation,
  TraversedDocument,
  TraversedEntry,
  TraversedTag,
} from '@/schemas/navigation'
import type { InfoObject, TagObject } from '@/schemas/v3.1/strict/openapi-document'

type ResolvedChannel = {
  channelName: string
  channel: AsyncApiChannelObject
  channelAddress: string
}

type AsyncApiTagLike = {
  name: string
  description?: string
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

const resolveOperationChannel = (
  document: AsyncApiDocument,
  operation: AsyncApiOperationObject,
): ResolvedChannel | undefined => {
  const resolved = resolveChannelNode(document, operation.channel)
  if (!resolved) {
    return undefined
  }

  const { channelName, channel } = resolved
  const channelAddress =
    typeof channel.address === 'string' && channel.address.length > 0 ? channel.address : channelName

  return { channelName, channel, channelAddress }
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

const createAsyncApiOperationEntry = ({
  operationName,
  operation,
  document,
  generateId,
  parentId,
  parentTag,
}: {
  operationName: string
  operation: AsyncApiOperationObject
  document: AsyncApiDocument
  generateId: TraverseSpecOptions['generateId']
  parentId: string
  parentTag?: ParentTag
}): TraversedAsyncApiOperation | undefined => {
  if (isHidden(operation as XInternal & XScalarIgnore)) {
    return undefined
  }

  const resolvedChannel = resolveOperationChannel(document, operation)
  if (!resolvedChannel) {
    return undefined
  }

  const { channelName, channelAddress } = resolvedChannel

  return {
    type: 'asyncapi-operation',
    id: generateId({
      type: 'asyncapi-operation',
      operationName,
      parentId,
      parentTag,
    }),
    title: getOperationTitle(operation, operationName),
    operationName,
    action: operation.action,
    channelName,
    channelAddress,
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
  options: { tagsSorter, operationsSorter, generateId },
  sortOrder,
}: {
  tagKeys: string[]
  tagsMap: TagsMap
  documentId: string
  options: Pick<TraverseSpecOptions, 'tagsSorter' | 'operationsSorter' | 'generateId'>
  sortOrder: string[] | undefined
}): TraversedTag[] => {
  const entries = tagKeys.flatMap((key) => {
    const { tag, entries: tagEntries } = getTag({ tagsMap, name: key, documentId, generateId })

    if (isHidden(tag)) {
      return []
    }

    const asyncApiOperations = tagEntries.filter(
      (entry): entry is TraversedAsyncApiOperation => entry.type === 'asyncapi-operation',
    )

    const sortOrder = tag['x-scalar-order']

    if (sortOrder === undefined) {
      sortAsyncApiOperations(asyncApiOperations, operationsSorter)
    }

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

/**
 * Traverses an AsyncAPI document to generate sidebar navigation for channel operations.
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

  const tagsMap: TagsMap = new Map()
  const untaggedOperations: TraversedAsyncApiOperation[] = []

  if (document.operations) {
    for (const operationName of objectKeys(document.operations)) {
      const operationNode = document.operations[operationName]
      if (!operationNode) {
        continue
      }

      const operation = getResolvedRef(operationNode, mergeSiblingReferences)

      const entry = createAsyncApiOperationEntry({
        operationName,
        operation,
        document,
        generateId,
        parentId: documentId,
      })

      if (!entry) {
        continue
      }

      const operationTags = operation.tags?.map((tag) => getResolvedRef(tag, mergeSiblingReferences)) ?? []

      if (operationTags.length === 0) {
        untaggedOperations.push(entry)
        continue
      }

      for (const tag of operationTags) {
        const tagName = tag.name ?? 'Untitled Tag'
        const tagObject = toTagObject(tag)
        const { id: tagId } = getTag({ tagsMap, name: tagName, documentId, generateId })
        const parentTag: ParentTag = { tag: tagObject, id: tagId }

        const taggedEntry = createAsyncApiOperationEntry({
          operationName,
          operation,
          document,
          generateId,
          parentId: tagId,
          parentTag,
        })

        if (!taggedEntry) {
          continue
        }

        const { entries } = getTag({ tagsMap, name: tagName, documentId, generateId })
        entries.push(taggedEntry)
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
        options: { tagsSorter, operationsSorter, generateId },
        sortOrder: document['x-scalar-order'],
      }),
    )
  }

  sortAsyncApiOperations(untaggedOperations, operationsSorter)
  entries.push(...untaggedOperations)

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
