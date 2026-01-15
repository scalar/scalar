import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'
import type { ParameterObject, ParameterWithContentObject } from '@/schemas/v3.1/strict/parameter'

export const isObjectSchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'object' }> => {
  return (
    'type' in schema && (schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object')))
  )
}

export const isArraySchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'array' }> => {
  return 'type' in schema && (schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array')))
}

export const isStringSchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'string' }> => {
  return (
    'type' in schema && (schema.type === 'string' || (Array.isArray(schema.type) && schema.type.includes('string')))
  )
}

export const isNumberSchema = (
  schema: SchemaObject,
): schema is Extract<SchemaObject, { type: 'number' | 'integer' }> => {
  return (
    'type' in schema &&
    (schema.type === 'number' ||
      schema.type === 'integer' ||
      (Array.isArray(schema.type) && schema.type.includes('number')) ||
      (Array.isArray(schema.type) && schema.type.includes('integer')))
  )
}

/** Special type guard to remove our internal type */
export const isSchema = (schema: SchemaObject | undefined): schema is Exclude<SchemaObject, { __scalar_: string }> =>
  schema !== undefined && 'type' in schema

/**
 * Type guard to check if the given parameter is a ParameterWithContentObject,
 * i.e., it has a 'content' property defined.
 */
export const isContentTypeParameterObject = (parameter: ParameterObject): parameter is ParameterWithContentObject => {
  return 'content' in parameter && parameter.content !== undefined
}
