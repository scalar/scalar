import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'

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
