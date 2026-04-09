import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

export type EntryType = 'operation' | 'webhook' | 'model' | 'heading' | 'tag'

export type FuseData = {
  type: EntryType
  id: string
  title: string
  description: string
  body?: string | string[]
  parameters?: string | string[]
  responseExamples?: string[]
  method?: string
  path?: string
  operationId?: string
  entry: TraversedEntry
}
