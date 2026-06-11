import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import type { OpenApiDocument } from './v3.1/strict/openapi-document'
import type { WorkspaceDocument } from './workspace'

/**
 * Narrow a value to an OpenAPI document.
 *
 * Discriminated by the required `openapi` string field on OAS documents. Accepts `unknown`
 * so it can narrow at any call site (e.g., workspace lookups typed as `WorkspaceDocument`,
 * or broader contexts that mix documents with the workspace itself).
 */
export const isOpenApiDocument = (value: unknown): value is OpenApiDocument =>
  isObject(value) && 'openapi' in value && typeof value.openapi === 'string'

/**
 * Narrow a value to an AsyncAPI document.
 *
 * Discriminated by the required `asyncapi` string field on AsyncAPI documents.
 */
export const isAsyncApiDocument = (value: unknown): value is AsyncApiDocument =>
  isObject(value) && 'asyncapi' in value && typeof value.asyncapi === 'string'

/**
 * Narrow a value to any workspace document (OpenAPI or AsyncAPI).
 *
 * Useful for mutators that operate on the parts shared between document shapes
 * (for example `components.securitySchemes`) without caring which spec the
 * document follows.
 */
export const isWorkspaceDocument = (value: unknown): value is WorkspaceDocument =>
  isOpenApiDocument(value) || isAsyncApiDocument(value)

/**
 * Identify the document type of a value.
 *
 * Returns `'openapi'` or `'asyncapi'` when the value matches one of the known
 * document shapes, or `undefined` when it matches neither.
 */
export const getDocumentType = (value: unknown): 'openapi' | 'asyncapi' | undefined => {
  if (isOpenApiDocument(value)) {
    return 'openapi'
  }

  if (isAsyncApiDocument(value)) {
    return 'asyncapi'
  }

  return undefined
}
