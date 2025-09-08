import { type Static, Type } from '@scalar/typebox'

import { WorkspaceDocumentSchema, WorkspaceMetaSchema } from '@/schemas/workspace'
import { ConfigSchema } from '@/schemas/workspace-specification/config'

const UnknownObjectSchema = Type.Record(Type.String(), Type.Unknown())

export const InMemoryWorkspaceSchema = Type.Object({
  meta: WorkspaceMetaSchema,
  documentConfigs: Type.Record(Type.String(), ConfigSchema),
  documents: Type.Record(Type.String(), WorkspaceDocumentSchema),
  originalDocuments: Type.Record(Type.String(), UnknownObjectSchema),
  intermediateDocuments: Type.Record(Type.String(), UnknownObjectSchema),
  overrides: Type.Record(Type.String(), Type.Any()),
  documentMeta: Type.Record(
    Type.String(),
    Type.Partial(
      Type.Object({
        documentSource: Type.Optional(Type.String()),
      }),
    ),
  ),
})

export type InMemoryWorkspace = Static<typeof InMemoryWorkspaceSchema>
