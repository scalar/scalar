import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

type Schema = NonNullable<OpenAPIV3_1.ComponentsObject['schemas']>[string]

const isArrayResponseSchema = (schema: Schema): boolean => {
  if (!schema) {
    return false
  }

  const resolvedSchema = getResolvedRef(schema)

  if (!resolvedSchema || typeof resolvedSchema !== 'object') {
    return false
  }

  if ('type' in resolvedSchema) {
    if (resolvedSchema.type === 'array') {
      return true
    }

    if (Array.isArray(resolvedSchema.type) && resolvedSchema.type.includes('array')) {
      return true
    }
  }

  return 'items' in resolvedSchema
}

export const normalizeResponseBody = (body: unknown, schema: Schema): unknown => {
  if (body === null || body === undefined || Array.isArray(body) || !isArrayResponseSchema(schema)) {
    return body
  }

  return [body]
}
