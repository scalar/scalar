import { slug } from 'github-slugger'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { AsyncApiDocument } from '@/schemas/asyncapi/v3.0/asyncapi-document'
import type { TraversedEntry, TraversedMessage, TraversedSchema } from '@/schemas/navigation'
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

  /** Function to generate unique IDs for messages */
  getMessageId: (message: { name: string; channel: string }) => string
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

  /**
   * Generate a message id.
   * If a custom generateMessageSlug function is provided in the referenceConfig, use it to generate the message slug.
   * Otherwise, fall back to using the default slug function from 'github-slugger' on the message name and channel.
   */
  const getMessageIdDefault: TraverseAsyncApiOptions['getMessageId'] = (message) => {
    // const generateMessageSlug = referenceConfig?.generateMessageSlug
    // if (generateMessageSlug) {
    //   return `message/${generateMessageSlug(message)}`
    // }
    return `message/${slug(message.channel)}/${slug(message.name)}`
  }

  return {
    // channelsSorter: referenceConfig?.channelsSorter ?? 'alpha',
    // operationsSorter: referenceConfig?.operationsSorter ?? 'action',
    getChannelId: getChannelIdDefault,
    getOperationId: getOperationIdDefault,
    getHeadingId: getHeadingIdDefault,
    getMessageId: getMessageIdDefault,
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
    action: operation.action as 'send' | 'receive',
    channel: operation.channel,
    isDeprecated: operation.deprecated,
  }
}

/**
 * Creates a traversed message entry for AsyncAPI messages.
 */
const createAsyncApiMessageEntry = (
  ref: string,
  messageName: string,
  channelName: string,
  message: {
    name?: string
    title?: string
    summary?: string
    description?: string
    deprecated?: boolean
  },
  getMessageId: TraverseAsyncApiOptions['getMessageId'],
): TraversedMessage => {
  const title = message.title || message.summary || message.name || messageName

  return {
    type: 'asyncapi-message',
    id: getMessageId({ name: messageName, channel: channelName }),
    title,
    ref,
    name: messageName,
    channel: channelName,
    isDeprecated: message.deprecated,
  }
}

/**
 * Traverses the messages in a channel to create message entries.
 */
const traverseChannelMessages = (
  channelName: string,
  channel: any,
  getMessageId: TraverseAsyncApiOptions['getMessageId'],
): TraversedMessage[] => {
  const messageEntries: TraversedMessage[] = []

  if (!channel.messages) {
    return messageEntries
  }

  // Process each message in the channel
  Object.entries(channel.messages).forEach(([messageName, messageRef]) => {
    // Resolve the message reference
    const resolvedMessage = getResolvedRef(messageRef)

    if (!resolvedMessage) {
      return
    }

    // Create reference to the message in components
    const ref = `#/components/messages/${(resolvedMessage as any)?.name || messageName}`

    const messageEntry = createAsyncApiMessageEntry(ref, messageName, channelName, resolvedMessage, getMessageId)

    messageEntries.push(messageEntry)
  })

  return messageEntries
}

/**
 * Traverses the schemas in an AsyncAPI document to create model entries.
 */
const traverseAsyncApiSchemas = (
  document: AsyncApiDocument,
  getModelId: TraverseAsyncApiOptions['getMessageId'],
): TraversedSchema[] => {
  const schemas = document.components?.schemas ?? {}
  const schemaEntries: TraversedSchema[] = []

  for (const name in schemas) {
    if (!Object.hasOwn(schemas, name)) {
      continue
    }

    const schema = getResolvedRef(schemas[name])

    if (!schema) {
      continue
    }

    const ref = `#/components/schemas/${name}`
    const title = (schema as any)?.title || name

    schemaEntries.push({
      type: 'model',
      id: getModelId({ name, channel: '' }), // Reuse message ID function for now
      title,
      ref,
      name,
    })
  }

  return schemaEntries
}

/**
 * Traverses the channels in an AsyncAPI document to build a map of operations organized by channels.
 */
export const traverseAsyncApiChannels = (
  document: AsyncApiDocument,
  getOperationId: TraverseAsyncApiOptions['getOperationId'],
  getMessageId: TraverseAsyncApiOptions['getMessageId'],
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
      // Handle ReferenceType - operation could be a $ref or the actual operation
      const actualOperation = '$ref' in operation ? operation['$ref-value'] : operation
      const channelName = actualOperation?.channel
      if (channelName && !channelOperationsMap.has(channelName)) {
        channelOperationsMap.set(channelName, [])
      }
      if (channelName) {
        channelOperationsMap.get(channelName)!.push({ operationId, operation: actualOperation })
      }
    })
  }

  // Then, create channel entries with their operations and messages
  Object.entries(document.channels).forEach(([channelName, channelItem]) => {
    // Handle ReferenceType - channelItem could be a $ref or the actual channel
    const actualChannel = '$ref' in channelItem ? channelItem['$ref-value'] : channelItem
    const channelOperations = channelOperationsMap.get(channelName) || []

    const operationEntries: TraversedEntry[] = channelOperations.map(({ operationId, operation }) => {
      const ref = `#/operations/${operationId}`
      return createAsyncApiOperationEntry(ref, operation, getOperationId)
    })

    // Sort operations by action (send first, then receive)
    operationEntries.sort((a, b) => {
      if (a.type === 'asyncapi-operation' && b.type === 'asyncapi-operation') {
        if (a.action === b.action) {
          return a.title.localeCompare(b.title)
        }
        return a.action === 'send' ? -1 : 1
      }
      return 0
    })

    // Get messages for this channel
    const messageEntries = traverseChannelMessages(channelName, actualChannel, getMessageId)

    // Create Messages group if there are messages
    const children: TraversedEntry[] = [...operationEntries]
    if (messageEntries.length > 0) {
      children.push({
        type: 'text',
        id: `messages-${slug(channelName)}`,
        title: 'Messages',
        children: messageEntries,
      })
    }

    const channelEntry: TraversedEntry = {
      type: 'channel',
      id: `channel/${slug(channelName)}`,
      title: actualChannel?.title || actualChannel?.summary || channelName,
      name: channelName,
      description: actualChannel?.description,
      children,
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
 * - Channel-based organization of operations and messages
 * - Optional description documentation
 * - Models section from components.schemas
 */
export const traverseAsyncApiDocument = (document: AsyncApiDocument, config?: DocumentConfiguration) => {
  const { getHeadingId, getOperationId, getMessageId } = getAsyncApiNavigationOptions(config)

  const entries: TraversedEntry[] = []

  // Add description if available
  const descriptionEntries = traverseDescription(document.info?.description, getHeadingId)
  entries.push(...descriptionEntries)

  // Add channels and their operations and messages
  const channelEntries = traverseAsyncApiChannels(document, getOperationId, getMessageId)
  entries.push(...channelEntries)

  // Add models if they are not hidden
  const hideModels = !config?.['x-scalar-reference-config']?.features?.showModels

  if (!hideModels && document.components?.schemas) {
    const untaggedModels = traverseAsyncApiSchemas(document, getMessageId)

    if (untaggedModels.length) {
      entries.push({
        type: 'text',
        id: 'models',
        title: 'Models',
        children: untaggedModels,
      })
    }
  }

  return { entries }
}
