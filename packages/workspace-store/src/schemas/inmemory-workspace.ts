import { PartialDeep, type TPartialDeep } from '@/schemas/typebox-types'
import { WorkspaceDocumentSchema, WorkspaceMetaSchema } from '@/schemas/workspace'
import { ConfigSchema } from '@/schemas/workspace-specification/config'
import { Type, type Static, type TObject, type TRecord, type TString } from '@sinclair/typebox'

type InMemoryWorkspaceSchemaType = TObject<{
  meta: typeof WorkspaceMetaSchema
  documentConfigs: TRecord<TString, typeof ConfigSchema>
  documents: TRecord<TString, typeof WorkspaceDocumentSchema>
  originalDocuments: TRecord<TString, typeof WorkspaceDocumentSchema>
  intermediateDocuments: TRecord<TString, typeof WorkspaceDocumentSchema>
  overrides: TRecord<TString, TPartialDeep<typeof WorkspaceDocumentSchema>>
}>

export const InMemoryWorkspaceSchema: InMemoryWorkspaceSchemaType = Type.Object({
  meta: WorkspaceMetaSchema,
  documentConfigs: Type.Record(Type.String(), ConfigSchema),
  documents: Type.Record(Type.String(), WorkspaceDocumentSchema),
  originalDocuments: Type.Record(Type.String(), WorkspaceDocumentSchema),
  intermediateDocuments: Type.Record(Type.String(), WorkspaceDocumentSchema),
  overrides: Type.Record(Type.String(), PartialDeep(WorkspaceDocumentSchema)),
})

export type InMemoryWorkspace = Static<typeof InMemoryWorkspaceSchema>
