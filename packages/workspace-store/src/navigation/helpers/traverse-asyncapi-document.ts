import { slug } from 'github-slugger'

import type { TraversedEntry } from '@/schemas/navigation'
import type { AsyncApiDocument } from '@/schemas/v3.0/asyncapi-document'
import type { DocumentConfiguration } from '@/schemas/workspace-specification/config'

import { traverseDescription } from './traverse-description'

/**
 * Configuration options for traversing an AsyncAPI specification document.
 */
export type TraverseAsyncApiOptions = {
  /** Controls how channels are sorted - either alphabetically or using a custom sort function */
  // TODO: We want to add this in the future.
  // channelsSorter?: 'alpha' | ((a: { name: string }, b: { name: string }) => number)

  /** Controls how operations are sorted - alphabetically, by action, or using a custom sort function */
  // TODO: We want to add this in the future.
  // operationsSorter?:
  //   | 'alpha'
  //   | 'action'
  //   | ((a: { action: string; channel: string }, b: { action: string; channel: string }) => number)

  /** Function to generate unique IDs for markdown headings */
  getHeadingId: (heading: { depth: number; value: string; slug?: string }) => string

  /** Function to generate unique IDs for operations */
  getOperationId: (operation: { action: string; channel: string; title?: string }) => string

  /** Function to generate unique IDs for channels */
  getChannelId: (channel: { name: string }) => string
}

/**
 * Returns options for traversing an AsyncAPI document, allowing customization of
 * how IDs and slugs are generated for channels and operations.
 */
export const getAsyncApiNavigationOptions = (config?: DocumentConfiguration): TraverseAsyncApiOptions => {
  const referenceConfig = config?.['x-scalar-reference-config']

  /**
   * Generate a channel id.
   * If a custom generateChannelSlug function is provided in the referenceConfig, use it to generate the channel slug.
   * Otherwise, fall back to using the default slug function from 'github-slugger' on the channel name.
   */
  const getChannelIdDefault: TraverseAsyncApiOptions['getChannelId'] = (channel) => {
    // const generateChannelSlug = referenceConfig?.generateChannelSlug
    // if (generateChannelSlug) {
    //   return `channel/${generateChannelSlug(channel)}`
    // }
    return `channel/${slug(channel.name)}`
  }

  /**
   * Generate an operation id.
   * If a custom generateOperationSlug function is provided in the referenceConfig, use it to generate the operation slug.
   * Otherwise, fall back to using the default slug function from 'github-slugger' on the operation title or action+channel.
   */
  const getOperationIdDefault: TraverseAsyncApiOptions['getOperationId'] = (operation) => {
    // const generateOperationSlug = referenceConfig?.generateOperationSlug
    // if (generateOperationSlug) {
    //   return `operation/${generateOperationSlug(operation)}`
    // }

    const title = operation.title || `${operation.action} ${operation.channel}`
    return `operation/${slug(title)}`
  }

  /**
   * Generate a heading id.
   * If a custom generateHeadingSlug function is provided in the referenceConfig, use it to generate the heading slug.
   * Otherwise, if the heading has a slug property, prefix it with 'description/'.
   * If neither is available, return an empty string.
   */
  const getHeadingIdDefault: TraverseAsyncApiOptions['getHeadingId'] = (heading) => {
    const generateHeadingSlug = referenceConfig?.generateHeadingSlug

    if (generateHeadingSlug) {
      return `${generateHeadingSlug(heading)}`
    }

    if (heading.slug) {
      return `description/${heading.slug}`
    }
    return ''
  }

  return {
    // channelsSorter: referenceConfig?.channelsSorter ?? 'alpha',
    // operationsSorter: referenceConfig?.operationsSorter ?? 'action',
    getChannelId: getChannelIdDefault,
    getOperationId: getOperationIdDefault,
    getHeadingId: getHeadingIdDefault,
  }
}

/**
 * Creates a traversed operation entry for AsyncAPI operations.
 */
const createAsyncApiOperationEntry = (
  ref: string,
  operation: {
    action: string
    channel: string
    title?: string
    summary?: string
    description?: string
    deprecated?: boolean
  },
  getOperationId: TraverseAsyncApiOptions['getOperationId'],
): TraversedEntry => {
  const title = operation.title || operation.summary || `${operation.action} ${operation.channel}`

  return {
    type: 'asyncapi-operation',
    id: getOperationId(operation),
    title,
    ref,
    action: operation.action as 'publish' | 'subscribe',
    channel: operation.channel,
    isDeprecated: operation.deprecated,
  }
}

/**
 * Traverses the channels in an AsyncAPI document to build a map of operations organized by channels.
 */
export const traverseAsyncApiChannels = (
  document: AsyncApiDocument,
  getOperationId: TraverseAsyncApiOptions['getOperationId'],
) => {
  const channelEntries: TraversedEntry[] = []

  if (!document.channels) {
    return channelEntries
  }

  // Group operations by channel
  const channelOperationsMap = new Map<string, Array<{ operationId: string; operation: any }>>()

  // First, collect all operations and group them by channel
  if (document.operations) {
    Object.entries(document.operations).forEach(([operationId, operation]) => {
      const channelName = operation.channel
      if (!channelOperationsMap.has(channelName)) {
        channelOperationsMap.set(channelName, [])
      }
      channelOperationsMap.get(channelName)!.push({ operationId, operation })
    })
  }

  // Then, create channel entries with their operations
  Object.entries(document.channels).forEach(([channelName, channelItem]) => {
    const channelOperations = channelOperationsMap.get(channelName) || []

    const operationEntries: TraversedEntry[] = channelOperations.map(({ operationId, operation }) => {
      const ref = `#/operations/${operationId}`
      return createAsyncApiOperationEntry(ref, operation, getOperationId)
    })

    // Sort operations by action (publish first, then subscribe)
    operationEntries.sort((a, b) => {
      if (a.type === 'asyncapi-operation' && b.type === 'asyncapi-operation') {
        if (a.action === b.action) {
          return a.title.localeCompare(b.title)
        }
        return a.action === 'publish' ? -1 : 1
      }
      return 0
    })

    const channelEntry: TraversedEntry = {
      type: 'channel',
      id: `channel/${slug(channelName)}`,
      title: channelItem.title || channelItem.summary || channelName,
      name: channelName,
      description: channelItem.description,
      children: operationEntries,
      isGroup: false,
    }

    channelEntries.push(channelEntry)
  })

  // Sort channels alphabetically
  channelEntries.sort((a, b) => {
    if (a.type === 'channel' && b.type === 'channel') {
      return a.title.localeCompare(b.title)
    }
    return 0
  })

  return channelEntries
}

/**
 * Traverses an AsyncAPI Document to generate navigation structure and metadata.
 *
 * This function processes the AsyncAPI document to create:
 * - A hierarchical navigation structure for the sidebar
 * - Channel-based organization of operations
 * - Optional description documentation
 */
export const traverseAsyncApiDocument = (document: AsyncApiDocument, config?: DocumentConfiguration) => {
  const { getHeadingId, getOperationId } = getAsyncApiNavigationOptions(config)

  const entries: TraversedEntry[] = []

  // Add description if available
  const descriptionEntries = traverseDescription(document.info?.description, getHeadingId)
  entries.push(...descriptionEntries)

  // Add channels and their operations
  const channelEntries = traverseAsyncApiChannels(document, getOperationId)
  entries.push(...channelEntries)

  return { entries }
}
