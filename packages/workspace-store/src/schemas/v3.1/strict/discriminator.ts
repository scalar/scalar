import { Type } from '@scalar/typebox'

/**
 * When request bodies or response payloads may be one of a number of different schemas, a Discriminator Object gives a hint about the expected schema of the document. This hint can be used to aid in serialization, deserialization, and validation. The Discriminator Object does this by implicitly or explicitly associating the possible values of a named property with alternative schemas.
 *
 * Note that discriminator MUST NOT change the validation outcome of the schema.
 */
export const DiscriminatorObjectSchemaDefinition = Type.Object({
  /** REQUIRED. The name of the property in the payload that will hold the discriminating value. This property SHOULD be required in the payload schema, as the behavior when the property is absent is undefined. */
  propertyName: Type.String(),
  /** An object to hold mappings between payload values and schema names or URI references. */
  mapping: Type.Optional(Type.Record(Type.String(), Type.String())),
})
