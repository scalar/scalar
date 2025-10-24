import { Type } from '@scalar/typebox'

import {
  type WorkspaceDocument,
  WorkspaceDocumentSchema,
  type WorkspaceMeta,
  WorkspaceMetaSchema,
} from '@/schemas/workspace'
import { type Config, ConfigSchema } from '@/schemas/workspace-specification/config'

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

export type InMemoryWorkspace = {
  meta: WorkspaceMeta
  documents: Record<string, WorkspaceDocument>
  originalDocuments: Record<string, Record<string, unknown>>
  intermediateDocuments: Record<string, Record<string, unknown>>
  overrides: Record<string, any>
  documentConfigs: Record<string, Config>
  documentMeta: Record<string, { documentSource?: string }>
}
