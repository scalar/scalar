// TODO: Can we use plain OpenAPI types here?
import type { TraversedEntry } from '@/features/traverse-schema'
import type { ParameterMap } from '@/libs/openapi'

export type EntryType = 'operation' | 'webhook' | 'model' | 'heading' | 'tag'

export type FuseData = {
  type: EntryType
  title: string
  description: string
  href: string
  // operationId?: string
  body?: string | string[] | ParameterMap
  // TODO: Rename to method
  method?: string
  path?: string
  entry: TraversedEntry
}
