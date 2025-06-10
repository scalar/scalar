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
  method: OpenAPIV3_1.HttpMethods
  path: string
  operation: OpenAPIV3_1.OperationObject
  type: 'operation'
}

/** Model entry returned form traversing the document */
export type TraversedSchema = TraverseEntryBase & {
  name: string
  schema: OpenAPIV3_1.SchemaObject
  type: 'model'
}

/** Tag entry returned form traversing the document, includes tagGroups */
export type TraversedTag = TraverseEntryBase & {
  name: string
  children?: TraversedEntry[]
  tag: OpenAPIV3_1.TagObject
  isGroup: boolean
  type: 'tag'
}

/** Webhook entry returned form traversing the document, basically the same as an operaation but with name instead of path */
export type TraversedWebhook = TraverseEntryBase & {
  method: OpenAPIV3_1.HttpMethods
  name: string
  webhook: OpenAPIV3_1.OperationObject
  type: 'webhook'
}

/** Entries returned form traversing the document */
export type TraversedEntry =
  | TraversedDescription
  | TraversedOperation
  | TraversedSchema
  | TraversedTag
  | TraversedWebhook

type OperationSortValue = { method: string; path: string; operation: OpenAPIV3_1.OperationObject }

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
