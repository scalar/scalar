import { Type } from '@scalar/typebox'
import { AVAILABLE_CLIENTS, type AvailableClients } from '@scalar/types/snippetz'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'
import {
  type XScalarClientConfigCookies,
  xScalarClientConfigCookiesSchema,
} from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-cookies'
import {
  type XScalarClientConfigEnvironments,
  xScalarClientConfigEnvironmentsSchema,
} from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-environments'
import type { SecuritySchemeObject } from '@/schemas/v3.1/strict/security-scheme'
import type { ServerObject } from '@/schemas/v3.1/strict/server'

import { type AsyncApiDocument, AsyncApiDocumentSchema } from './asyncapi'
import {
  OpenAPIDocumentSchema,
  type OpenApiDocument,
  SecuritySchemeObjectSchema,
  ServerObjectSchema,
} from './v3.1/strict/openapi-document'

// Union type for API documents (OpenAPI or AsyncAPI)
export type ApiDefinition = OpenApiDocument | AsyncApiDocument

export const WorkspaceDocumentMetaSchema = Type.Partial(
  Type.Object({
    [extensions.document.activeAuth]: Type.String(),
    [extensions.document.activeServer]: Type.String(),
  }),
)

export type WorkspaceDocumentMeta = {
  [extensions.document.activeAuth]?: string
  [extensions.document.activeServer]?: string
}

// Union type for workspace documents that can be either OpenAPI or AsyncAPI
export const WorkspaceDocumentSchema = Type.Union([
  Type.Intersect([WorkspaceDocumentMetaSchema, OpenAPIDocumentSchema]),
  Type.Intersect([WorkspaceDocumentMetaSchema, AsyncApiDocumentSchema]),
])

export type WorkspaceDocument = (WorkspaceDocumentMeta & OpenApiDocument) | (WorkspaceDocumentMeta & AsyncApiDocument)

export const WorkspaceMetaSchema = Type.Partial(
  Type.Object({
    [extensions.workspace.darkMode]: Type.Boolean(),
    [extensions.workspace.defaultClient]: Type.Union(AVAILABLE_CLIENTS.map((client) => Type.Literal(client))),
    [extensions.workspace.activeDocument]: Type.String(),
    [extensions.workspace.theme]: Type.String(),
  }),
)

export type WorkspaceMeta = {
  [extensions.workspace.darkMode]?: boolean
  [extensions.workspace.defaultClient]?: AvailableClients[number]
  [extensions.workspace.activeDocument]?: string
  [extensions.workspace.theme]?: string
}

export const WorkspaceExtensionsSchema = Type.Partial(
  Type.Object({
    'x-scalar-client-config-environments': xScalarClientConfigEnvironmentsSchema,
    'x-scalar-client-config-cookies': xScalarClientConfigCookiesSchema,
    'x-scalar-client-config-servers': Type.Array(ServerObjectSchema),
    'x-scalar-client-config-security-schemes': Type.Record(Type.String(), SecuritySchemeObjectSchema),
  }),
)

export type WorkspaceExtensions = {
  'x-scalar-client-config-environments'?: XScalarClientConfigEnvironments
  'x-scalar-client-config-cookies'?: XScalarClientConfigCookies
  'x-scalar-client-config-servers'?: ServerObject[]
  'x-scalar-client-config-security-schemes'?: Record<string, SecuritySchemeObject>
}

export const WorkspaceSchema = compose(
  WorkspaceMetaSchema,
  Type.Object({
    documents: Type.Record(Type.String(), WorkspaceDocumentSchema),
    /** Active document is possibly undefined if we attempt to lookup with an invalid key */
    activeDocument: Type.Union([Type.Undefined(), WorkspaceDocumentSchema]),
  }),
  WorkspaceExtensionsSchema,
)

export type Workspace = WorkspaceMeta & {
  documents: Record<string, WorkspaceDocument>
  activeDocument: WorkspaceDocument | undefined
} & WorkspaceExtensions
