import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Ref } from 'vue'

/** Map of tagNames and their entries */
export type TagsMap = Map<string, { tag: OpenAPIV3_1.TagObject; entries: (TraversedOperation | TraversedWebhook)[] }>

/** Description entry returned form traversing the document */
export type TraversedDescription = {
  type: 'description'
  id: string
  title: string
  children?: TraversedDescription[]
}

/** Operation entry returned form traversing the document */
export type TraversedOperation = {
  type: 'operation'
  id: string
  title: string
  method: OpenAPIV3_1.HttpMethods
  path: string
  operation: OpenAPIV3_1.OperationObject
}

/** Model entry returned form traversing the document */
export type TraversedSchema = {
  type: 'model'
  id: string
  title: string
  name: string
  schema: OpenAPIV3_1.SchemaObject
}

/** Tag entry returned form traversing the document, includes tagGroups */
export type TraversedTag = {
  type: 'tag'
  id: string
  title: string
  children: (TraversedOperation | TraversedWebhook)[]
  tag: OpenAPIV3_1.TagObject
}

/** Webhook entry returned form traversing the document, basically the same as an operaation but with name instead of path */
export type TraversedWebhook = {
  type: 'webhook'
  id: string
  title: string
  method: OpenAPIV3_1.HttpMethods
  name: string
  webhook: OpenAPIV3_1.OperationObject
}

/** A heading to group entries */
export type TraversedHeading = {
  type: 'heading'
  id: string
  title: string
  isModels?: boolean
  isWebhooks?: boolean
  children: TraversedEntry[]
}

/** Entries returned form traversing the document */
export type TraversedEntry =
  | TraversedDescription
  | TraversedHeading
  | TraversedTag
  | TraversedOperation
  | TraversedWebhook
  | TraversedSchema

/** Options for traversing the spec */
export type TraverseSpecOptions = {
  config: Ref<ApiReferenceConfiguration>
} & Pick<UseNavState, 'getHeadingId' | 'getModelId' | 'getOperationId' | 'getSectionId' | 'getTagId' | 'getWebhookId'>
