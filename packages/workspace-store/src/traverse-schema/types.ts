import type { Heading } from '@scalar/types/legacy'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

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
  method: OpenAPIV3_1.HttpMethods
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
  method: OpenAPIV3_1.HttpMethods
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

/** Create sidebar options */
export type TraverseSpecOptions = {
  tagsSorter: 'alpha' | ((a: OpenAPIV3_1.TagObject, b: OpenAPIV3_1.TagObject) => number)
  operationsSorter: 'alpha' | 'method' | ((a: OperationSortValue, b: OperationSortValue) => number)
  hideModels: boolean
  getHeadingId: (heading: Heading) => string
  getOperationId: (
    operation: {
      path: string
      method: OpenAPIV3_1.HttpMethods
    } & OpenAPIV3_1.OperationObject,
    parentTag: OpenAPIV3_1.TagObject,
  ) => string
  getWebhookId: (
    webhook?: {
      name: string
      method?: string
    },
    parentTag?: OpenAPIV3_1.TagObject,
  ) => string
  getModelId: (model?: {
    name: string
  }) => string
  getTagId: (tag: OpenAPIV3_1.TagObject) => string
}
