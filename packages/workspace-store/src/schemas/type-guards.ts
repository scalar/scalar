import { isObject } from '@scalar/helpers/object/is-object'
import type { ArazzoDocument } from '@scalar/types/arazzo/1.1'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import type { OpenApiDocument } from './v3.1/strict/openapi-document'

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
 * Narrow a value to an Arazzo document.
 *
 * Discriminated by the required `arazzo` string field on Arazzo documents.
 */
export const isArazzoDocument = (value: unknown): value is ArazzoDocument =>
  isObject(value) && 'arazzo' in value && typeof value.arazzo === 'string'

/**
 * Identify the document type of a value.
 *
 * Returns `'openapi'`, `'asyncapi'`, or `'arazzo'` when the value matches one of the known
 * document shapes, or `undefined` when it matches none.
 */
export const getDocumentType = (value: unknown): 'openapi' | 'asyncapi' | 'arazzo' | undefined => {
  if (isOpenApiDocument(value)) {
    return 'openapi'
  }

  if (isAsyncApiDocument(value)) {
    return 'asyncapi'
  }

  if (isArazzoDocument(value)) {
    return 'arazzo'
  }

  return undefined
}

/**
 * Human-readable label for a document type, e.g. for badges and warnings.
 *
 * Defaults to `'OpenAPI'` when the type is unknown, matching the OpenAPI-native surfaces that
 * only distinguish AsyncAPI and Arazzo as exceptions.
 */
export const getDocumentTypeLabel = (documentType: 'openapi' | 'asyncapi' | 'arazzo' | undefined): string => {
  if (documentType === 'asyncapi') {
    return 'AsyncAPI'
  }

  if (documentType === 'arazzo') {
    return 'Arazzo'
  }

  return 'OpenAPI'
}
