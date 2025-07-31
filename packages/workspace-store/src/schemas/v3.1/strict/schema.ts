import { Type, type Static } from '@sinclair/typebox'
import { DiscriminatorObjectSchema } from './discriminator'
import { XMLObjectSchema } from './xml'
import { ExternalDocumentationObjectSchema } from './external-documentation'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/compose'

const SchemaExtensionsSchema = Type.Partial(
  Type.Object({
    'x-tags': Type.Array(Type.String()),
  }),
)

/**
 * Core JSON Schema properties that are fundamental to schema definition.
 */
const CoreSchemaProperties = Type.Object({
  /** A title for the schema. */
  title: Type.Optional(Type.String()),
  /** A description of the schema. */
  description: Type.Optional(Type.String()),
  /** Default value for the schema. */
  default: Type.Optional(Type.Unknown()),
  /** The data type of the schema. */
  type: Type.Optional(
    Type.Union([
      Type.Literal('array'),
      Type.Literal('boolean'),
      Type.Literal('integer'),
      Type.Literal('number'),
      Type.Literal('object'),
      Type.Literal('string'),
      Type.Literal('null'),
    ]),
  ),
  /** Array of allowed values. */
  enum: Type.Optional(Type.Array(Type.Any())),
  /** Constant value that must match exactly. */
  const: Type.Optional(Type.Any()),
})

/**
 * Numeric validation properties for number and integer types.
 */
const NumericProperties = Type.Object({
  /** Number must be a multiple of this value. */
  multipleOf: Type.Optional(Type.Number()),
  /** Maximum value (inclusive). */
  maximum: Type.Optional(Type.Number()),
  /** Maximum value (exclusive). */
  exclusiveMaximum: Type.Optional(Type.Union([Type.Boolean(), Type.Number()])),
  /** Minimum value (inclusive). */
  minimum: Type.Optional(Type.Number()),
  /** Minimum value (exclusive). */
  exclusiveMinimum: Type.Optional(Type.Union([Type.Boolean(), Type.Number()])),
})

/**
 * String validation properties for string types.
 */
const StringValidationProperties = Type.Object({
  /** Maximum string length. */
  maxLength: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Minimum string length. */
  minLength: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Regular expression pattern. */
  pattern: Type.Optional(Type.String()),
})

/**
 * Array validation properties for array types.
 */
const ArrayValidationProperties = Type.Object({
  /** Maximum number of items in array. */
  maxItems: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Minimum number of items in array. */
  minItems: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Whether array items must be unique. */
  uniqueItems: Type.Optional(Type.Boolean()),
  /** Schema for array items. */
  items: Type.Optional(Type.Any()),
  /** Schema for tuple validation. */
  prefixItems: Type.Optional(Type.Array(Type.Any())),
})

/**
 * Object validation properties for object types.
 */
const ObjectValidationProperties = Type.Object({
  /** Maximum number of properties. */
  maxProperties: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Minimum number of properties. */
  minProperties: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Array of required property names. */
  required: Type.Optional(Type.Array(Type.String())),
  /** Object property definitions. */
  properties: Type.Optional(Type.Record(Type.String(), Type.Any())),
  /** Schema for additional properties. */
  additionalProperties: Type.Optional(Type.Union([Type.Boolean(), Type.Any()])),
  /** Properties matching regex patterns. */
  patternProperties: Type.Optional(Type.Record(Type.String(), Type.Any())),
})

/**
 * Composition properties for combining schemas.
 */
const CompositionProperties = Type.Object({
  /** All schemas must be valid. */
  allOf: Type.Optional(Type.Array(Type.Any())),
  /** Exactly one schema must be valid. */
  oneOf: Type.Optional(Type.Array(Type.Any())),
  /** At least one schema must be valid. */
  anyOf: Type.Optional(Type.Array(Type.Any())),
  /** Schema must not be valid. */
  not: Type.Optional(Type.Any()),
})

/**
 * OpenAPI 3.1 specific properties for content validation and metadata.
 */
const OpenAPI31Properties = Type.Object({
  /** Media type for content validation. */
  contentMediaType: Type.Optional(Type.String()),
  /** Content encoding. */
  contentEncoding: Type.Optional(Type.String()),
  /** Schema for content validation. */
  contentSchema: Type.Optional(Type.Any()),
  /** Whether the schema is deprecated. */
  deprecated: Type.Optional(Type.Boolean()),
  /** Adds support for polymorphism. The discriminator is used to determine which of a set of schemas a payload is expected to satisfy. See Composition and Inheritance for more details. */
  discriminator: Type.Optional(DiscriminatorObjectSchema),
  /** Whether the schema is read-only. */
  readOnly: Type.Optional(Type.Boolean()),
  /** Whether the schema is write-only. */
  writeOnly: Type.Optional(Type.Boolean()),
  /** This MAY be used only on property schemas. It has no effect on root schemas. Adds additional metadata to describe the XML representation of this property. */
  xml: Type.Optional(XMLObjectSchema),
  /** Additional external documentation for this schema. */
  externalDocs: Type.Optional(ExternalDocumentationObjectSchema),
  /**
   * A free-form field to include an example of an instance for this schema. To represent examples that cannot be naturally represented in JSON or YAML, a string value can be used to contain the example with escaping where necessary.
   *
   * @deprecated The example field has been deprecated in favor of the JSON Schema examples keyword. Use of example is discouraged, and later versions of this specification may remove it.
   */
  example: Type.Optional(Type.Any()),
  /**
   * An array of examples of valid instances for this schema. This keyword follows the JSON Schema Draft 2020-12 specification.
   * Each example should be a valid instance of the schema.
   */
  examples: Type.Optional(Type.Array(Type.Unknown())),
})

/**
 * The Schema Object allows the definition of input and output data types. These types can be objects, but also primitives and arrays. This object is a superset of the JSON Schema Specification Draft 2020-12. The empty schema (which allows any instance to validate) MAY be represented by the boolean value true and a schema which allows no instance to validate MAY be represented by the boolean value false.
 *
 * For more information about the keywords, see JSON Schema Core and JSON Schema Validation.
 *
 * Unless stated otherwise, the keyword definitions follow those of JSON Schema and do not add any additional semantics; this includes keywords such as $schema, $id, $ref, and $dynamicRef being URIs rather than URLs. Where JSON Schema indicates that behavior is defined by the application (e.g. for annotations), OAS also defers the definition of semantics to the application consuming the OpenAPI document.
 */
export const SchemaObjectSchema = compose(ExtensionsSchema, SchemaExtensionsSchema)

export type SchemaObject = Static<typeof SchemaObjectSchema>
