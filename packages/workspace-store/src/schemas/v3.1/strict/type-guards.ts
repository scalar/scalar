import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'

export const isObjectSchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'object' }> => {
  return 'type' in schema && schema.type === 'object'
}

export const isArraySchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'array' }> => {
  return 'type' in schema && schema.type === 'array'
}

export const isStringSchema = (schema: SchemaObject): schema is Extract<SchemaObject, { type: 'string' }> => {
  return 'type' in schema && schema.type === 'string'
}

export const isNumberSchema = (
  schema: SchemaObject,
): schema is Extract<SchemaObject, { type: 'number' | 'integer' }> => {
  return 'type' in schema && (schema.type === 'number' || schema.type === 'integer')
}
