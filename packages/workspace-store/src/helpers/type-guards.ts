import type { UnknownObject } from '@/helpers/general'
import type { ApiDefinition } from '@/schemas'
import type { AsyncApiDocument } from '@/schemas/asyncapi/v3.0/asyncapi-document'
import type { MultiFormatSchemaObject } from '@/schemas/asyncapi/v3.0/multi-format-schema'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

/**
 * OpenAPI 3.x document
 */
export function isOpenApiDocument(doc: ApiDefinition | UnknownObject): doc is OpenApiDocument {
  return 'openapi' in doc
}

/**
 * OpenAPI or Swagger document
 */
export function isOpenApiOrSwaggerDocument(doc: ApiDefinition | UnknownObject): doc is UnknownObject {
  return 'openapi' in doc || 'swagger' in doc
}

/**
 * AsyncAPI document
 */
export function isAsyncApiDocument(doc: ApiDefinition | UnknownObject): doc is AsyncApiDocument {
  return 'asyncapi' in doc
}

/**
 * Multi-format schema object
 */
export function isMultiFormatSchemaObject(obj: UnknownObject): obj is MultiFormatSchemaObject {
  return 'schemaFormat' in obj && 'schema' in obj
}
