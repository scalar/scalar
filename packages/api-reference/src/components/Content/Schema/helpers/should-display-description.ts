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

  // Don't show description for schemas with compositions to avoid duplicate descriptions
  if (schema.allOf) {
    return null
  }

  if (propDescription && schema.description && (schema.oneOf || schema.anyOf)) {
    return propDescription === schema.description ? propDescription : `${propDescription}\n\n${schema.description}`
  }

  return propDescription || schema.description || null
}
