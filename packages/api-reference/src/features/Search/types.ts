import type { TraversedEntry } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { ParameterMap } from '@/libs/openapi'

export type EntryType = 'operation' | 'webhook' | 'model' | 'heading' | 'tag'

export type FuseData = {
  type: EntryType
  id?: string
  title: string
  description: string
  href: string
  body?: string | string[] | ParameterMap
  method?: string
  path?: string
  entry: TraversedEntry
}
