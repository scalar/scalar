import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { hasComplexArrayItems } from './has-complex-array-items'

/**
 * Check if array item composition should be rendered
 *
 * @param schema - The schema object to check
 * @param composition - The composition keyword to check for
 * @returns true if array item composition should be rendered, false otherwise
 */
export const shouldRenderArrayItemComposition = (schema: SchemaObject | undefined, composition: string): boolean => {
  // Early return if schema is invalid or not an array
  if (!schema || !isArraySchema(schema)) {
    return false
  }

  // Check if items exist and have the composition keyword
  const items = schema.items
  if (!items || typeof items !== 'object' || !(composition in items)) {
    return false
  }

  // Only render if items are not complex (complex items are handled differently)
  return !hasComplexArrayItems(schema)
}
