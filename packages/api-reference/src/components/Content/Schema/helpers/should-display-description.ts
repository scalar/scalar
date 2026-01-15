import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Determine if description should be displayed
 *
 * @param schema - The schema object to check
 * @param propDescription - Optional description from props
 * @returns Description string to display, or null if should not be displayed
 */
export const shouldDisplayDescription = (schema: SchemaObject | undefined, propDescription?: string): string | null => {
  if (!schema) {
    return null
  }

  // Don't show description for schemas with properties or compositions
  if ('properties' in schema || 'additionalProperties' in schema || 'patternProperties' in schema || schema.allOf) {
    return null
  }

  return propDescription || schema.description || null
}
