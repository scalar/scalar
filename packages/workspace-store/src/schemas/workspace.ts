import { Type } from '@scalar/typebox'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'

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
      // A built-in client id (e.g. `js/fetch`) or a custom sample id (e.g. `custom/python`)
      [extensions.workspace.defaultClient]: Type.Union([
        ...AVAILABLE_CLIENTS.map((client) => Type.Literal(client)),
        Type.String({ pattern: '^custom/' }),
      ]),
      // The example key (from an operation's `examples` map) selected across the document,
      // so request and response example pickers stay in sync between operations
      [extensions.workspace.defaultExample]: Type.String(),
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
  // A built-in client id (e.g. `js/fetch`) or a custom sample id (e.g. `custom/python`).
  // Typed as a plain string to avoid tripping TypeScript's "union too complex" limit when
  // this type flows into a Vue `defineProps`; valid values are enforced at runtime.
  [extensions.workspace.defaultClient]?: string
  // The example key shared across the document so example pickers stay in sync between operations
  [extensions.workspace.defaultExample]?: string
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
