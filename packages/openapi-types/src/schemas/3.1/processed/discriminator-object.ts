import { z } from 'zod'

/**
 * Discriminator Object
 *
 * When request bodies or response payloads may be one of a number of different schemas, a Discriminator Object gives a
 * hint about the expected schema of the document. This hint can be used to aid in serialization, deserialization, and
 * validation. The Discriminator Object does this by implicitly or explicitly associating the possible values of a named
 * property with alternative schemas.
 *
 * Note that discriminator MUST NOT change the validation outcome of the schema.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#discriminator-object
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
