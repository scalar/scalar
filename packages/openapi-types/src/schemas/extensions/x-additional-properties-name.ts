import { z } from 'zod'

/**
 * x-additionalPropertiesName
 *
 * Custom attribute name for additionalProperties in a schema.
 * This allows specifying a descriptive name for additional properties
 * that may be present in an object.
 */
export const XAdditionalPropertiesNameSchema = z.object({
  'x-additionalPropertiesName': z.string().optional().catch(undefined),
})
