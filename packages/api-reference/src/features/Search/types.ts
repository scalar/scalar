// TODO: Can we use plain OpenAPI types here?
import type { ParameterMap } from '@/libs/openapi'

// TODO: Rename types
export type EntryType = 'req' | 'webhook' | 'model' | 'heading' | 'tag'

export type FuseData = {
  title: string
  href: string
  type: EntryType
  operationId?: string
  description: string
  body?: string | string[] | ParameterMap
  // TODO: Rename to method
  httpVerb?: string
  path?: string
}
