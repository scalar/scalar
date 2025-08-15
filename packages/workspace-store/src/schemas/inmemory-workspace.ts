import { PartialDeep } from '@/schemas/typebox-types'
import { OpenAPIDocumentSchema as OpenAPIDocumentSchemaLoose } from '@/schemas/v3.1/loose/openapi-document'
import { WorkspaceDocumentSchema, WorkspaceMetaSchema } from '@/schemas/workspace'
import { ConfigSchema } from '@/schemas/workspace-specification/config'
import { Type, type Static } from '@sinclair/typebox'

export const InMemoryWorkspaceSchema = Type.Object({
  meta: WorkspaceMetaSchema,
  documentConfigs: Type.Record(Type.String(), ConfigSchema),
  documents: Type.Record(Type.String(), WorkspaceDocumentSchema),
  originalDocuments: Type.Record(Type.String(), OpenAPIDocumentSchemaLoose),
  intermediateDocuments: Type.Record(Type.String(), OpenAPIDocumentSchemaLoose),
  overrides: Type.Record(Type.String(), PartialDeep(WorkspaceDocumentSchema)),
  documentMeta: Type.Record(
    Type.String(),
    Type.Partial(
      Type.Object({
        origin: Type.Optional(Type.String()),
      }),
    ),
  ),
})

export type InMemoryWorkspace = Static<typeof InMemoryWorkspaceSchema>
