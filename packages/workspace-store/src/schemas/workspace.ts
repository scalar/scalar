import { Type } from '@scalar/typebox'
import { AVAILABLE_CLIENTS, type AvailableClients } from '@scalar/types/snippetz'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'
import { type XScalarEnvironments, xScalarEnvironmentsSchema } from '@/schemas/extensions/document'
import {
  type XScalarActiveEnvironment,
  type XScalarCookies,
  type XScalarOrder,
  XScalarActiveEnvironmentSchema,
  xScalarCookiesSchema,
  XScalarOrderSchema,
} from '@/schemas/extensions/general'
import {
  type XScalarActiveProxy,
  type XScalarTabs,
  XScalarActiveProxySchema,
  XScalarTabsSchema,
} from '@/schemas/extensions/workspace'

import type { AsyncApiDocument } from './asyncapi/asyncapi-document'
import type { OpenAPIExtensions, OpenApiDocument } from './v3.1/strict/openapi-document'

export type WorkspaceDocumentMeta = Omit<
  OpenAPIExtensions,
  'x-original-oas-version' | 'x-scalar-original-source-url' | 'x-scalar-original-document-hash'
>

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
