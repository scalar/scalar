import type { SchemaObject, SchemaReferenceType } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Display dialect supplied by AsyncAPI; never serialized into the API description. */
export const schemaDialect = Symbol('schema-dialect')

/** Draft-07 constraints retained by the AsyncAPI schema view. */
export type ConstraintSchema = SchemaObject & {
  [schemaDialect]?: 'draft-07'
  if?: SchemaReferenceType<SchemaObject> | boolean
  then?: SchemaReferenceType<SchemaObject> | boolean
  else?: SchemaReferenceType<SchemaObject> | boolean
  contains?: SchemaReferenceType<SchemaObject> | boolean
  dependencies?: Record<string, string[] | SchemaReferenceType<SchemaObject> | boolean>
}
