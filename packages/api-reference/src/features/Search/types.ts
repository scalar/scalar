import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import type { ParameterMap } from '@/libs/openapi'

export type EntryType = 'operation' | 'webhook' | 'model' | 'heading' | 'tag'

export type FuseData = {
  type: EntryType
  id: string
  title: string
  description: string
  body?: string | string[] | ParameterMap
  method?: string
  path?: string
  operationId?: string
  entry: TraversedEntry
}
