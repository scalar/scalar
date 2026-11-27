import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

import { hasComplexArrayItems } from './has-complex-array-items'

/** Whether the array declares the composition on its item schema. */
export const hasArrayItemComposition = (schema: SchemaObject | undefined, composition: string): boolean =>
  Boolean(
    schema && isArraySchema(schema) && schema.items && typeof schema.items === 'object' && composition in schema.items,
  )

/**
 * Check if array item composition should be rendered
 *
 * @param schema - The schema object to check
 * @param composition - The composition keyword to check for
 * @returns true if array item composition should be rendered, false otherwise
 */
export const shouldRenderArrayItemComposition = (schema: SchemaObject | undefined, composition: string): boolean =>
  hasArrayItemComposition(schema, composition) && !hasComplexArrayItems(schema)
