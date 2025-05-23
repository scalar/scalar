import { type Static, Type } from '@sinclair/typebox'
import { OpenAPIDocumentSchema } from './openapi-document'

const WorkspaceDocumentMetaSchema = Type.Partial(
  Type.Object({
    'x-scalar-active-auth': Type.String(),
    'x-scalar-active-server': Type.String(),
  }),
)

export type WorkspaceDocumentMeta = Static<typeof WorkspaceDocumentMetaSchema>

export const WorkspaceDocumentSchema = Type.Intersect([WorkspaceDocumentMetaSchema, OpenAPIDocumentSchema])

export type WorkspaceDocument = Static<typeof WorkspaceDocumentSchema>

const WorkspaceMetaSchema = Type.Partial(
  Type.Object({
    'x-scalar-dark-mode': Type.Boolean(),
    'x-scalar-default-client': Type.String(),
    'x-scalar-active-document': Type.String(),
    'x-scalar-theme': Type.String(),
  }),
)

export type WorkspaceMeta = Static<typeof WorkspaceMetaSchema>

export const WorkspaceSchema = Type.Intersect([
  WorkspaceMetaSchema,
  Type.Object({
    documents: Type.Record(Type.String(), Type.Partial(WorkspaceDocumentSchema)),
  }),
])

export type Workspace = Static<typeof WorkspaceSchema>
