import { Type } from '@scalar/typebox'
import { AVAILABLE_CLIENTS, type AvailableClients } from '@scalar/types/snippetz'
import { type Schema, union } from '@scalar/validation'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'
import {
  type XScalarEnvironments,
  xScalarEnvironmentsSchema,
} from '@/schemas/extensions/document/x-scalar-environments'
import {
  type XScalarActiveEnvironment,
  XScalarActiveEnvironmentSchema,
} from '@/schemas/extensions/general/x-scalar-active-environment'
import { type XScalarCookies, xScalarCookiesSchema } from '@/schemas/extensions/general/x-scalar-cookies'
import { type XScalarOrder, XScalarOrderSchema } from '@/schemas/extensions/general/x-scalar-order'
import { type XScalarActiveProxy, XScalarActiveProxySchema } from '@/schemas/extensions/workspace/x-scalar-active-proxy'
import { type XScalarTabs, XScalarTabsSchema } from '@/schemas/extensions/workspace/x-scalar-tabs'
import { generateSchema as generateOpenApiSchema } from '@/schemas/v3.1/openapi'

import { AsyncApiDocument } from './asyncapi/asyncapi-document'
import type { OpenAPIExtensions, OpenApiDocument } from './v3.1/strict/openapi-document'

export type WorkspaceDocumentMeta = Omit<
  OpenAPIExtensions,
  'x-original-oas-version' | 'x-scalar-original-source-url' | 'x-scalar-original-document-hash'
>

/**
 * A document held by the workspace — a discriminated union of OpenAPI and AsyncAPI.
 * Narrow with the `isOpenApiDocument` / `isAsyncApiDocument` guards in `@/schemas/type-guards`
 * before touching spec-specific fields.
 *
 * The OpenAPI half is built via {@link generateOpenApiSchema}, which takes a `maybeRef`
 * callback so callers can plug in their own `$ref` handling (the in-memory store passes
 * `recursiveRef`; consumers parsing raw input can pass an identity function).
 */
export const getWorkspaceDocumentSchema = (maybeRef: (inner: Schema) => Schema): Schema =>
  union([generateOpenApiSchema(maybeRef), AsyncApiDocument], { typeName: 'WorkspaceDocument' })

export type WorkspaceDocument = OpenApiDocument | AsyncApiDocument

export const ColorModeSchema = Type.Union([Type.Literal('system'), Type.Literal('light'), Type.Literal('dark')])

export const WorkspaceMetaSchema = Type.Partial(
  compose(
    Type.Object({
      [extensions.workspace.colorMode]: ColorModeSchema,
      [extensions.workspace.defaultClient]: Type.Union(AVAILABLE_CLIENTS.map((client) => Type.Literal(client))),
      [extensions.workspace.activeDocument]: Type.String(),
      [extensions.workspace.theme]: Type.String(),
      [extensions.workspace.sidebarWidth]: Type.Number({ default: 288 }),
    }),
    XScalarActiveProxySchema,
  ),
)

export type ColorMode = 'system' | 'light' | 'dark'

export type WorkspaceMeta = {
  [extensions.workspace.colorMode]?: ColorMode
  [extensions.workspace.defaultClient]?: AvailableClients[number]
  [extensions.workspace.activeDocument]?: string
  [extensions.workspace.theme]?: string
  [extensions.workspace.sidebarWidth]?: number
} & XScalarActiveProxy

export const WorkspaceExtensionsSchema = compose(
  xScalarEnvironmentsSchema,
  XScalarActiveEnvironmentSchema,
  XScalarOrderSchema,
  xScalarCookiesSchema,
  XScalarTabsSchema,
)

export type WorkspaceExtensions = XScalarEnvironments &
  XScalarActiveEnvironment &
  XScalarOrder &
  XScalarCookies &
  XScalarTabs

export type Workspace = WorkspaceMeta & {
  documents: Record<string, WorkspaceDocument>
  activeDocument: WorkspaceDocument | undefined
} & WorkspaceExtensions

export type DocumentMetaExtensions = WorkspaceDocumentMeta & OpenAPIExtensions
