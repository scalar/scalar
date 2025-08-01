// TODO: Can we use plain OpenAPI types here?
import type { TraversedEntry } from '@/features/traverse-schema'
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
