import { XScalarEnvironments } from '@scalar/schemas/extensions/document'
import { XScalarActiveEnvironment, XScalarCookies, XScalarOrder } from '@scalar/schemas/extensions/general'
import { XScalarTabs } from '@scalar/schemas/extensions/workspace'
import { Type } from '@scalar/typebox'
import type { XScalarEnvironments as XScalarEnvironmentsType } from '@scalar/types/extensions/document'
import type {
  XScalarActiveEnvironment as XScalarActiveEnvironmentType,
  XScalarCookies as XScalarCookiesType,
  XScalarOrder as XScalarOrderType,
} from '@scalar/types/extensions/general'
import type { XScalarActiveProxy, XScalarTabs as XScalarTabsType } from '@scalar/types/extensions/workspace'
import type { OpenApiDocument, OpenApiExtensions } from '@scalar/types/openapi/3.1'
import { AVAILABLE_CLIENTS, type AvailableClients } from '@scalar/types/snippetz'
import { intersection } from '@scalar/validation'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'

import type { AsyncApiDocument } from './asyncapi/asyncapi-document'

export type WorkspaceDocumentMeta = Omit<
  OpenApiExtensions,
  'x-original-oas-version' | 'x-scalar-original-source-url' | 'x-scalar-original-document-hash'
>

export type WorkspaceDocument = OpenApiDocument | AsyncApiDocument

export const ColorModeSchema = Type.Union([Type.Literal('system'), Type.Literal('light'), Type.Literal('dark')])

const XScalarActiveProxySchema = Type.Object({
  'x-scalar-active-proxy': Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

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

export const WorkspaceExtensionsSchema = intersection([
  XScalarEnvironments,
  XScalarActiveEnvironment,
  XScalarOrder,
  XScalarCookies,
  XScalarTabs,
])

export type WorkspaceExtensions = XScalarEnvironmentsType &
  XScalarActiveEnvironmentType &
  XScalarOrderType &
  XScalarCookiesType &
  XScalarTabsType

export type Workspace = WorkspaceMeta & {
  documents: Record<string, WorkspaceDocument>
  activeDocument: WorkspaceDocument | undefined
} & WorkspaceExtensions

export type DocumentMetaExtensions = WorkspaceDocumentMeta & OpenApiExtensions
