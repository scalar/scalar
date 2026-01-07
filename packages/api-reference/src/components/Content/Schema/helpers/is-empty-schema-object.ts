import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isTypeObject } from '@/components/Content/Schema/helpers/is-type-object'

/**
 * Determines if the given schema is an empty object schema.
 * An empty object schema is defined as a schema with type 'object'
 * and no defined properties, no additionalProperties (or set to false), and no patternProperties.
 */
export const isEmptySchemaObject = (schema: SchemaObject | undefined): boolean => {
  if (!isTypeObject(schema)) {
    return false
  }

  const hasNoProperties = Object.keys(schema.properties ?? {}).length === 0
  const hasNoAdditionalProperties = schema.additionalProperties === undefined || schema.additionalProperties === false
  const hasNoPatternProperties = Object.keys(schema.patternProperties ?? {}).length === 0

  return hasNoProperties && hasNoAdditionalProperties && hasNoPatternProperties
}
