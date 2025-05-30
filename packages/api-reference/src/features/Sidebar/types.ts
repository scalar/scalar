import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import type { UseNavState } from '@/hooks/useNavState'
import type { Ref } from 'vue'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Copied from the old useSidebar hook for backwards compatibility, we will update it later */
export type SidebarEntry = {
  id: string
  title: string
  children?: SidebarEntry[]
  httpVerb?: OpenAPIV3_1.HttpMethods
  operationId?: string
  name?: string
  path?: string
  deprecated?: boolean
  isGroup?: boolean

  webhook?: OpenAPIV3_1.OperationObject
  tag?: OpenAPIV3_1.TagObject
  operation?: OpenAPIV3_1.OperationObject
}

/** Create sidebar options */
export type CreateSidebarOptions = {
  config: Ref<ApiReferenceConfiguration>
  /** You can optionally pass in these refs in case you need them before the hook is instantiated */
  isSidebarOpen?: Ref<boolean>
} & Pick<UseNavState, 'getHeadingId' | 'getModelId' | 'getOperationId' | 'getSectionId' | 'getTagId' | 'getWebhookId'>
