import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import type { UseNavState } from '@/hooks/useNavState'
import type { Ref } from 'vue'

/** Copied from the old useSidebar hook for backwards compatibility, we will update it later */
export type SidebarEntry = {
  id: string
  title: string
  children?: SidebarEntry[]
  httpVerb?: string
  operationId?: string
  path?: string
  deprecated?: boolean
  isGroup?: boolean
}

/** Create sidebar options */
export type CreateSidebarOptions = {
  config: Ref<ApiReferenceConfiguration>
  /** You can optionally pass in these refs in case you need them before the hook is instantiated */
  isSidebarOpen?: Ref<boolean>
} & Pick<UseNavState, 'getHeadingId' | 'getModelId' | 'getOperationId' | 'getSectionId' | 'getTagId' | 'getWebhookId'>
