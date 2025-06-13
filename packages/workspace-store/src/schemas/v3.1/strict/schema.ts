import { Type, type Static } from '@sinclair/typebox'
import { DiscriminatorObjectSchema } from './discriminator'
import { XMLObjectSchema } from './xml'
import { ExternalDocumentationObjectSchema } from './external-documentation'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'

const SchemaExtensionsSchema = Type.Partial(
  Type.Object({
    'x-tags': Type.Array(Type.String()),
  }),
)

/**
 * The Schema Object allows the definition of input and output data types. These types can be objects, but also primitives and arrays. This object is a superset of the JSON Schema Specification Draft 2020-12. The empty schema (which allows any instance to validate) MAY be represented by the boolean value true and a schema which allows no instance to validate MAY be represented by the boolean value false.
 *
 * For more information about the keywords, see JSON Schema Core and JSON Schema Validation.
 *
 * Unless stated otherwise, the keyword definitions follow those of JSON Schema and do not add any additional semantics; this includes keywords such as $schema, $id, $ref, and $dynamicRef being URIs rather than URLs. Where JSON Schema indicates that behavior is defined by the application (e.g. for annotations), OAS also defers the definition of semantics to the application consuming the OpenAPI document.
 */
export const SchemaObjectSchema = compose(
  Type.Object({
    /** Adds support for polymorphism. The discriminator is used to determine which of a set of schemas a payload is expected to satisfy. See Composition and Inheritance for more details. */
    discriminator: Type.Optional(DiscriminatorObjectSchema),
    /** This MAY be used only on property schemas. It has no effect on root schemas. Adds additional metadata to describe the XML representation of this property. */
    xml: Type.Optional(XMLObjectSchema),
    /** Additional external documentation for this schema. */
    externalDocs: Type.Optional(ExternalDocumentationObjectSchema),
    /**
     * A free-form field to include an example of an instance for this schema. To represent examples that cannot be naturally represented in JSON or YAML, a string value can be used to contain the example with escaping where necessary.
     *
     * Deprecated: The example field has been deprecated in favor of the JSON Schema examples keyword. Use of example is discouraged, and later versions of this specification may remove it.
     */
    example: Type.Optional(Type.Any()),
  }),
  ExtensionsSchema,
  SchemaExtensionsSchema,
  Type.Record(Type.String(), Type.Unknown()),
)

export type SchemaObject = Static<typeof SchemaObjectSchema>
