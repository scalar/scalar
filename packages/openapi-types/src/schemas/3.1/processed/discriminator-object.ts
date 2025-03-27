import { z } from 'zod'

/**
 * When request bodies or response payloads may be one of a number of different schemas,
 * a discriminator object can be used to aid in serialization, deserialization, and validation.
 */
export const DiscriminatorObjectSchema = z.object({
  /**
   * REQUIRED. The name of the property in the payload that will hold the discriminator value.
   * This property SHOULD be required in the payload schema.
   */
  propertyName: z.string(),

  /**
   * An object to hold mappings between payload values and schema names or references.
   * Keys MUST be strings, but implementations MAY convert response values to strings for comparison.
   */
  mapping: z.record(z.string(), z.string()).optional(),
})

export type DiscriminatorObject = z.infer<typeof DiscriminatorObjectSchema>
