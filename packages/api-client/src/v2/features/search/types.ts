import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

type EntryType = 'operation' | 'heading' | 'tag'

type BaseFuse = {
  id: string
  type: EntryType
  documentName: string
  entry: TraversedEntry
  title: string
  description: string
}

type OperationFuse = BaseFuse & {
  type: 'operation'
  method: string
  path: string
  operationId?: string
}

type HeadingFuse = BaseFuse & {
  type: 'heading'
}

type TagFuse = BaseFuse & {
  type: 'tag'
}

export type FuseData = OperationFuse | HeadingFuse | TagFuse
