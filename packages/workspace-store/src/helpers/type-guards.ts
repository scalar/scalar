import type { UnknownObject } from '@/helpers/general'
import type { ApiDefinition } from '@/schemas'
import type { AsyncApiDocument } from '@/schemas/asyncapi/v3.0/asyncapi-document'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

export function isOpenApiDocument(doc: ApiDefinition | UnknownObject): doc is OpenApiDocument {
  return 'openapi' in doc || 'swagger' in doc
}

export function isAsyncApiDocument(doc: ApiDefinition | UnknownObject): doc is AsyncApiDocument {
  return 'asyncapi' in doc
}
