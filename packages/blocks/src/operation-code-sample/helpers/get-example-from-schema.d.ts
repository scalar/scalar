import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
type GetExampleFromSchemaOptions = {
  /** Fallback string for empty string values. */
  emptyString?: string
  /** Whether to use XML tag names as keys. */
  xml?: boolean
  /** Whether to show read-only/write-only properties. */
  mode?: 'read' | 'write'
  /** Dynamic variables which can replace values via x-variable. */
  variables?: Record<string, unknown>
  /** Whether to omit empty and optional properties. */
  omitEmptyAndOptionalProperties?: boolean
}
/**
 * Generate an example value from a given OpenAPI SchemaObject.
 *
 * This function recursively processes OpenAPI schemas to create realistic example data.
 * It handles all OpenAPI schema types including primitives, objects, arrays, and
 * composition schemas (allOf, oneOf, anyOf).
 * Uses a tonne of caching for maximum performance.
 *
 * @param schema - The OpenAPI SchemaObject to generate an example from.
 * @param options - Options to customize example generation.
 * @param level - The current recursion depth.
 * @param parentSchema - The parent schema, if any.
 * @param name - The name of the property being processed.
 * @returns An example value for the given schema.
 */
export declare const getExampleFromSchema: (
  schema: SchemaObject,
  options?: GetExampleFromSchemaOptions,
  {
    level,
    parentSchema,
    name,
    seen,
  }?: Partial<{
    level: number
    parentSchema: SchemaObject
    name: string
    seen: WeakSet<object>
  }>,
) => unknown
export {}
//# sourceMappingURL=get-example-from-schema.d.ts.map
