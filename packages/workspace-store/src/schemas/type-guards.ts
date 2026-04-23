import type { AsyncApiDocument } from './asyncapi/asyncapi-document'
import type { OpenApiDocument } from './v3.1/strict/openapi-document'

/**
 * Narrow a value to an OpenAPI document.
 *
 * Discriminated by the required `openapi` string field on OAS documents. Accepts `unknown`
 * so it can narrow at any call site (e.g., workspace lookups typed as `WorkspaceDocument`,
 * or broader contexts that mix documents with the workspace itself).
 */
export const isOpenApiDocument = (value: unknown): value is OpenApiDocument =>
  typeof value === 'object' &&
  value !== null &&
  'openapi' in value &&
  typeof (value as { openapi: unknown }).openapi === 'string'

/**
 * Narrow a value to an AsyncAPI document.
 *
 * Discriminated by the required `asyncapi` string field on AsyncAPI documents.
 */
export const isAsyncApiDocument = (value: unknown): value is AsyncApiDocument =>
  typeof value === 'object' &&
  value !== null &&
  'asyncapi' in value &&
  typeof (value as { asyncapi: unknown }).asyncapi === 'string'
