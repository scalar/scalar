import { type Static, Type } from '@sinclair/typebox'
import { OpenAPIDocumentSchema } from './v3.1/strict/openapi-document'
import { extensions } from '@/schemas/extensions'
import { compose } from '@/schemas/compose'
import { xScalarClientConfigEnvironmentsSchema } from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-environments'
import { xScalarClientConfigCookiesSchema } from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-cookies'
import { ServerObjectSchema } from '@/schemas/v3.1/strict/server'
import { SecuritySchemeObjectSchema } from '@/schemas/v3.1/strict/security-scheme'
import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'

const WorkspaceDocumentMetaSchema = Type.Partial(
  Type.Object({
    [extensions.document.activeAuth]: Type.String(),
    [extensions.document.activeServer]: Type.String(),
  }),
)

export type WorkspaceDocumentMeta = Static<typeof WorkspaceDocumentMetaSchema>

export const WorkspaceDocumentSchema = compose(WorkspaceDocumentMetaSchema, OpenAPIDocumentSchema)

export type WorkspaceDocument = Static<typeof WorkspaceDocumentSchema>

export const WorkspaceMetaSchema = Type.Partial(
  Type.Object({
    [extensions.workspace.darkMode]: Type.Boolean(),
    [extensions.workspace.defaultClient]: Type.Union(AVAILABLE_CLIENTS.map((client) => Type.Literal(client))),
    [extensions.workspace.activeDocument]: Type.String(),
    [extensions.workspace.theme]: Type.String(),
  }),
)

export type WorkspaceMeta = Static<typeof WorkspaceMetaSchema>

export const WorkspaceExtensionsSchema = Type.Partial(
  Type.Object({
    'x-scalar-client-config-environments': xScalarClientConfigEnvironmentsSchema,
    'x-scalar-client-config-cookies': xScalarClientConfigCookiesSchema,
    'x-scalar-client-config-servers': Type.Array(ServerObjectSchema),
    'x-scalar-client-config-security-schemes': Type.Record(Type.String(), SecuritySchemeObjectSchema),
  }),
)

export type WorkspaceExtensions = Static<typeof WorkspaceExtensionsSchema>

export const WorkspaceSchema = compose(
  WorkspaceMetaSchema,
  Type.Object({
    documents: Type.Record(Type.String(), WorkspaceDocumentSchema),
    /** Active document is possibly undefined if we attempt to lookup with an invalid key */
    activeDocument: Type.Union([Type.Undefined(), WorkspaceDocumentSchema]),
  }),
  WorkspaceExtensionsSchema,
)

export type Workspace = Static<typeof WorkspaceSchema>
