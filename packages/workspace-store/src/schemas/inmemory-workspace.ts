import { Type } from '@scalar/typebox'

import { type DocumentAuth, DocumentAuthSchema } from '@/entities/auth/schema'
import { type DocumentHistory, DocumentHistorySchema } from '@/entities/history/schema'
import { compose } from '@/schemas/compose'
import {
  type WorkspaceDocument,
  WorkspaceDocumentSchema,
  type WorkspaceExtensions,
  WorkspaceExtensionsSchema,
  type WorkspaceMeta,
  WorkspaceMetaSchema,
} from '@/schemas/workspace'

const UnknownObjectSchema = Type.Record(Type.String(), Type.Unknown())

export const InMemoryWorkspaceSchema = Type.Object({
  meta: compose(WorkspaceMetaSchema, WorkspaceExtensionsSchema),
  documents: Type.Record(Type.String(), WorkspaceDocumentSchema),
  originalDocuments: Type.Record(Type.String(), UnknownObjectSchema),
  intermediateDocuments: Type.Record(Type.String(), UnknownObjectSchema),
  overrides: Type.Record(Type.String(), Type.Any()),
  history: DocumentHistorySchema,
  auth: DocumentAuthSchema,
})

export type InMemoryWorkspace = {
  meta: WorkspaceMeta & WorkspaceExtensions
  documents: Record<string, WorkspaceDocument>
  originalDocuments: Record<string, Record<string, unknown>>
  intermediateDocuments: Record<string, Record<string, unknown>>
  overrides: Record<string, any>
  history: DocumentHistory
  auth: DocumentAuth
}
