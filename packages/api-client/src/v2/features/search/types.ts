import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
export type EntryType = 'operation' | 'heading' | 'tag'

export type BaseFuse = {
  id: string
  type: EntryType
  documentName: string
  entry: TraversedEntry
  title: string
  description: string
}

export type OperationFuse = BaseFuse & {
  type: 'operation'
  method: string
  path: string
  operationId?: string
}

export type HeadingFuse = BaseFuse & {
  type: 'heading'
}

export type TagFuse = BaseFuse & {
  type: 'tag'
}

export type FuseData = OperationFuse | HeadingFuse | TagFuse
