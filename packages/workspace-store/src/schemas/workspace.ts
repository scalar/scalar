import { type Static, Type } from '@sinclair/typebox'
import { OpenAPIDocumentSchema } from './openapi-v3/openapi-document'
import { extensions } from '@/schemas/extensions'

const WorkspaceDocumentMetaSchema = Type.Partial(
  Type.Object({
    [extensions.document.activeAuth]: Type.String(),
    [extensions.document.activeServer]: Type.String(),
  }),
)

export type WorkspaceDocumentMeta = Static<typeof WorkspaceDocumentMetaSchema>

export const WorkspaceDocumentSchema = Type.Intersect([WorkspaceDocumentMetaSchema, OpenAPIDocumentSchema])

export type WorkspaceDocument = Static<typeof WorkspaceDocumentSchema>

const WorkspaceMetaSchema = Type.Partial(
  Type.Object({
    [extensions.workspace.darkMode]: Type.Boolean(),
    [extensions.workspace.defaultClient]: Type.String(),
    [extensions.workspace.activeDocument]: Type.String(),
    [extensions.workspace.theme]: Type.String(),
  }),
)

export type WorkspaceMeta = Static<typeof WorkspaceMetaSchema>

export const WorkspaceSchema = Type.Intersect([
  WorkspaceMetaSchema,
  Type.Object({
    documents: Type.Record(Type.String(), Type.Partial(WorkspaceDocumentSchema)),
    /** Active document is possibly undefined if we attempt to lookup with an invalid key */
    activeDocument: Type.Union([Type.Undefined(), Type.Partial(WorkspaceDocumentSchema)]),
  }),
])

export type Workspace = Static<typeof WorkspaceSchema>
