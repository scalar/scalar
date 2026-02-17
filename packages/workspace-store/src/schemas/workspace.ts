import { Type } from '@scalar/typebox'
import { AVAILABLE_CLIENTS, type AvailableClients } from '@scalar/types/snippetz'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'
import {
  type XScalarEnvironments,
  xScalarEnvironmentsSchema,
} from '@/schemas/extensions/document/x-scalar-environments'
import { type XScalarCookies, xScalarCookiesSchema } from '@/schemas/extensions/general/x-scalar-cookies'
import { type XScalarOrder, XScalarOrderSchema } from '@/schemas/extensions/general/x-scalar-order'
import {
  type XScalarSelectedServer,
  XScalarSelectedServerSchema,
} from '@/schemas/extensions/server/x-scalar-selected-server'
import {
  type XScalarActiveEnvironment,
  XScalarActiveEnvironmentSchema,
} from '@/schemas/extensions/workspace/x-scalar-active-environment'
import { type XScalarActiveProxy, XScalarActiveProxySchema } from '@/schemas/extensions/workspace/x-scalar-active-proxy'
import { type XScalarTabs, XScalarTabsSchema } from '@/schemas/extensions/workspace/x-scalar-tabs'

import { OpenAPIDocumentSchema, type OpenApiDocument } from './v3.1/strict/openapi-document'

export const WorkspaceDocumentMetaSchema = compose(
  Type.Partial(
    Type.Object({
      [extensions.document.activeAuth]: Type.String(),
      'x-scalar-watch-mode': Type.Boolean(),
    }),
  ),
  XScalarSelectedServerSchema,
)

export type WorkspaceDocumentMeta = {
  [extensions.document.activeAuth]?: string
  'x-scalar-watch-mode'?: boolean
} & XScalarSelectedServer

// Note: use Type.Intersect to combine schemas here because Type.Compose does not work as expected with Modules
export const WorkspaceDocumentSchema = Type.Intersect([WorkspaceDocumentMetaSchema, OpenAPIDocumentSchema])

export type WorkspaceDocument = WorkspaceDocumentMeta & OpenApiDocument

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
