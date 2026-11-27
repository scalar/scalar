import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { isPluginDocument } from './plugin-document'
import type { OpenApiDocument } from './v3.2/strict/openapi-document'

/**
 * Narrow a value to an OpenAPI document.
 *
 * Discriminated by the required `openapi` string field on OAS documents. Accepts `unknown`
 * so it can narrow at any call site (e.g., workspace lookups typed as `WorkspaceDocument`,
 * or broader contexts that mix documents with the workspace itself). Documents claimed by a registered
 * document type are excluded, whatever fields they carry.
 */
export const isOpenApiDocument = (value: unknown): value is OpenApiDocument =>
  isObject(value) && 'openapi' in value && typeof value.openapi === 'string' && !isPluginDocument(value)

/**
 * Narrow a value to an AsyncAPI document.
 *
 * Discriminated by the required `asyncapi` string field on AsyncAPI documents. Documents claimed by a
 * registered document type are excluded, whatever fields they carry.
 */
export const isAsyncApiDocument = (value: unknown): value is AsyncApiDocument =>
  isObject(value) && 'asyncapi' in value && typeof value.asyncapi === 'string' && !isPluginDocument(value)

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

/**
 * Human-readable label for a document type, e.g. for badges and warnings.
 *
 * Defaults to `'OpenAPI'` when the type is unknown, matching the OpenAPI-native surfaces that
 * only distinguish AsyncAPI as the exception.
 */
export const getDocumentTypeLabel = (documentType: 'openapi' | 'asyncapi' | undefined): string =>
  documentType === 'asyncapi' ? 'AsyncAPI' : 'OpenAPI'
