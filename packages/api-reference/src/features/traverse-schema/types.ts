import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import type { UseNavState } from '@/hooks/useNavState'
import type { Ref } from 'vue'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Map of tagNames and their entries */
export type TagsMap = Map<string, { tag: OpenAPIV3_1.TagObject; entries: TraversedEntry[] }>

/** Description entry returned form traversing the document */
export type TraversedDescription = {
  id: string
  title: string
  children?: TraversedDescription[]
}

/** Operation entry returned form traversing the document */
export type TraversedOperation = {
  id: string
  title: string
  method: OpenAPIV3_1.HttpMethods
  path: string
  operation: OpenAPIV3_1.OperationObject
}

/** Model entry returned form traversing the document */
export type TraversedSchema = {
  id: string
  title: string
  name: string
  schema: OpenAPIV3_1.SchemaObject
}

/** Tag entry returned form traversing the document, includes tagGroups */
export type TraversedTag = {
  id: string
  title: string
  children: TraversedEntry[]
  tag: OpenAPIV3_1.TagObject
  isGroup: boolean
  isWebhooks?: boolean
}

/** Webhook entry returned form traversing the document, basically the same as an operaation but with name instead of path */
export type TraversedWebhook = {
  id: string
  title: string
  method: OpenAPIV3_1.HttpMethods
  name: string
  webhook: OpenAPIV3_1.OperationObject
}

/** Entries returned form traversing the document */
export type TraversedEntry =
  | TraversedDescription
  | TraversedOperation
  | TraversedSchema
  | TraversedTag
  | TraversedWebhook

/** Options for traversing the spec */
export type TraverseSpecOptions = {
  config: Ref<ApiReferenceConfiguration>
} & Pick<UseNavState, 'getHeadingId' | 'getModelId' | 'getOperationId' | 'getSectionId' | 'getTagId' | 'getWebhookId'>
