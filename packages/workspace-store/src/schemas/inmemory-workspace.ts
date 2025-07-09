import { WorkspaceDocumentSchema, WorkspaceMetaSchema } from '@/schemas/workspace'
import { ConfigSchema } from '@/schemas/workspace-specification/config'
import { Type, type Static } from '@sinclair/typebox'

export const InMemoryWorkspaceSchema = Type.Object({
  meta: WorkspaceMetaSchema,
  documentConfigs: Type.Record(Type.String(), ConfigSchema),
  documents: Type.Record(Type.String(), WorkspaceDocumentSchema),
  originalDocuments: Type.Record(Type.String(), WorkspaceDocumentSchema),
  intermediateDocuments: Type.Record(Type.String(), WorkspaceDocumentSchema),
})

export type InMemoryWorkspace = Static<typeof InMemoryWorkspaceSchema>
