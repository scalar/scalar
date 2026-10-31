import type { SchemaObject, SchemaReferenceType } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Display dialect resolved by the schema adapters; never serialized into the API description. */
export const schemaDialect = Symbol('schema-dialect')

/** JSON Schema constraints retained by the display view. */
export type ConstraintSchema = SchemaObject & {
  [schemaDialect]?: 'draft-07' | '2019-09' | '2020-12' | 'unsupported'
  $schema?: string
  minContains?: number
  maxContains?: number
  dependentRequired?: Record<string, string[]>
  dependentSchemas?: Record<string, SchemaReferenceType<SchemaObject> | boolean>
  if?: SchemaReferenceType<SchemaObject> | boolean
  then?: SchemaReferenceType<SchemaObject> | boolean
  else?: SchemaReferenceType<SchemaObject> | boolean
  contains?: SchemaReferenceType<SchemaObject> | boolean
  dependencies?: Record<string, string[] | SchemaReferenceType<SchemaObject> | boolean>
}
