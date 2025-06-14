import type { OperationObject } from '@/schemas/v3.1/strict/path-operations'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

/** Map of tagNames and their entries */
export type TagsMap = Map<string, { tag: TagObject; entries: TraversedEntry[] }>

type TraverseEntryBase = {
  type: 'text' | 'operation' | 'model' | 'tag' | 'webhook'
  id: string
  title: string
}

/** Description entry returned form traversing the document */
export type TraversedDescription = TraverseEntryBase & {
  type: 'text'
  children?: TraverseEntryBase[]
}

/** Operation entry returned form traversing the document */
export type TraversedOperation = TraverseEntryBase & {
  type: 'operation'
  ref: string
  method: string
  path: string
}

/** Model entry returned form traversing the document */
export type TraversedSchema = TraverseEntryBase & {
  type: 'model'
  ref: string
  name: string
}

/** Tag entry returned form traversing the document, includes tagGroups */
export type TraversedTag = TraverseEntryBase & {
  type: 'tag'
  name: string
  children?: TraversedEntry[]
  isGroup: boolean
}

/** Webhook entry returned form traversing the document, basically the same as an operation but with name instead of path */
export type TraversedWebhook = TraverseEntryBase & {
  type: 'webhook'
  ref: string
  method: string
  name: string
}

/** Entries returned form traversing the document */
export type TraversedEntry =
  | TraversedDescription
  | TraversedOperation
  | TraversedSchema
  | TraversedTag
  | TraversedWebhook

type OperationSortValue = { method: string; path: string; ref: string }

/** Configuration options for traversing an OpenAPI specification document.
 *
 * These options control how the document is processed and organized, including:
 * - Sorting of tags and operations
 * - Visibility of models
 * - ID generation for various elements (headings, operations, webhooks, models, tags)
 */
export type TraverseSpecOptions = {
  /** Controls how tags are sorted - either alphabetically or using a custom sort function */
  tagsSorter: 'alpha' | ((a: TagObject, b: TagObject) => number)

  /** Controls how operations are sorted - alphabetically, by method, or using a custom sort function */
  operationsSorter: 'alpha' | 'method' | ((a: OperationSortValue, b: OperationSortValue) => number)

  /** Whether to hide model schemas from the navigation */
  hideModels: boolean

  /** Function to generate unique IDs for markdown headings */
  getHeadingId: (heading: {
    depth: number
    value: string
    slug?: string
  }) => string

  /** Function to generate unique IDs for operations */
  getOperationId: (
    operation: {
      path: string
      method: string
    } & OperationObject,
    parentTag: TagObject,
  ) => string

  /** Function to generate unique IDs for webhooks */
  getWebhookId: (
    webhook?: {
      name: string
      method?: string
    },
    parentTag?: TagObject,
  ) => string

  /** Function to generate unique IDs for models/schemas */
  getModelId: (
    model?: {
      name: string
    },
    parentTag?: TagObject,
  ) => string

  /** Function to generate unique IDs for tags */
  getTagId: (tag: TagObject) => string
}

export type Heading = { depth: number; value: string; slug?: string }
