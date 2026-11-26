import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Display-only target for native schema cycles already truncated by their reader. */
export const schemaRecursiveTarget = Symbol('schema-recursive-target')

/** Schema with a known native recursion target, without a synthetic JSON reference. */
export type RecursiveSchema = SchemaObject & { [schemaRecursiveTarget]?: string }
