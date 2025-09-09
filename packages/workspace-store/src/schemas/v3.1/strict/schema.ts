import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { XInternalSchema } from '@/schemas/extensions/document/x-internal'
import { XScalarIgnoreSchema } from '@/schemas/extensions/document/x-scalar-ignore'
import { XTags } from '@/schemas/extensions/document/x-tags'
import { XAdditionalPropertiesNameSchema } from '@/schemas/extensions/schema/x-additional-properties-name'
import { XEnumDescriptionsSchema } from '@/schemas/extensions/schema/x-enum-descriptions'
import { XEnumVarNamesSchema } from '@/schemas/extensions/schema/x-enum-varnames'
import { XVariableSchema } from '@/schemas/extensions/schema/x-variable'
import {
  DiscriminatorObjectRef,
  ExternalDocumentationObjectRef,
  SchemaObjectRef,
  XMLObjectRef,
} from '@/schemas/v3.1/strict/ref-definitions'
import { reference } from '@/schemas/v3.1/strict/reference'

const schemaOrReference = Type.Union([SchemaObjectRef, reference(SchemaObjectRef)])

/**
 * Primitive types that don't have additional validation properties.
 * These types (null, boolean, string, number, integer, object, array) can be used
 * without additional validation constraints.
 *
 * TODO: Type array will actually validate against every union type but we can cross that bridge when we come to it
 */
const OtherTypes = Type.Object({
  type: Type.Union([
    Type.Literal('null'),
    Type.Literal('boolean'),
    Type.Array(
      Type.Union([
        Type.Literal('null'),
        Type.Literal('boolean'),
        Type.Literal('string'),
        Type.Literal('number'),
        Type.Literal('integer'),
        Type.Literal('object'),
        Type.Literal('array'),
      ]),
    ),
  ]),
})

/**
 * Numeric validation properties for number and integer types.
 */
const NumericProperties = Type.Object({
  type: Type.Union([Type.Literal('number'), Type.Literal('integer')]),
  /** Different subtypes */
  format: Type.Optional(
    Type.Union([
      // Integer formats
      Type.Literal('int8'),
      Type.Literal('int16'),
      Type.Literal('int32'),
      Type.Literal('int64'),
      Type.Literal('uint8'),
      Type.Literal('uint16'),
      Type.Literal('uint32'),
      Type.Literal('uint64'),
      Type.Literal('double-int'),
      // Number formats
      Type.Literal('float'),
      Type.Literal('double'),
      Type.Literal('decimal'),
      Type.Literal('decimal128'),
      // Structured field number formats
      Type.Literal('sf-integer'),
      Type.Literal('sf-decimal'),
    ]),
  ),
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
  type: Type.Literal('string'),
  /** Different subtypes */
  format: Type.Optional(
    Type.Union([
      // Date and time formats
      Type.Literal('date'),
      Type.Literal('date-time'),
      Type.Literal('date-time-local'),
      Type.Literal('time'),
      Type.Literal('time-local'),
      Type.Literal('duration'),
      Type.Literal('http-date'),
      // Network formats
      Type.Literal('email'),
      Type.Literal('idn-email'),
      Type.Literal('hostname'),
      Type.Literal('idn-hostname'),
      Type.Literal('ipv4'),
      Type.Literal('ipv6'),
      Type.Literal('uri'),
      Type.Literal('uri-reference'),
      Type.Literal('uri-template'),
      Type.Literal('iri'),
      Type.Literal('iri-reference'),
      Type.Literal('uuid'),
      // Content formats
      Type.Literal('binary'),
      Type.Literal('byte'),
      Type.Literal('base64url'),
      Type.Literal('html'),
      Type.Literal('commonmark'),
      Type.Literal('password'),
      Type.Literal('regex'),
      Type.Literal('json-pointer'),
      Type.Literal('relative-json-pointer'),
      Type.Literal('media-range'),
      // Character formats
      Type.Literal('char'),
      // Structured field string formats
      Type.Literal('sf-string'),
      Type.Literal('sf-token'),
      Type.Literal('sf-binary'),
      Type.Literal('sf-boolean'),
    ]),
  ),
  /** Maximum string length. */
  maxLength: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Minimum string length. */
  minLength: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Regular expression pattern. */
  pattern: Type.Optional(Type.String()),
})

const CorePropertiesWithSchema = Type.Object({
  name: Type.Optional(Type.String()),
  /** A title for the schema. */
  title: Type.Optional(Type.String()),
  /** A description of the schema. */
  description: Type.Optional(Type.String()),
  /** Default value for the schema. */
  default: Type.Optional(Type.Unknown()),
  /** Array of allowed values. */
  enum: Type.Optional(Type.Array(Type.Unknown())),
  /** Constant value that must match exactly. */
  const: Type.Optional(Type.Unknown()),

  // OpenAPI 3.1
  /** Media type for content validation. */
  contentMediaType: Type.Optional(Type.String()),
  /** Content encoding. */
  contentEncoding: Type.Optional(Type.String()),
  /** Schema for content validation. */
  contentSchema: Type.Optional(schemaOrReference),
  /** Whether the schema is deprecated. */
  deprecated: Type.Optional(Type.Boolean()),
  /** Adds support for polymorphism. The discriminator is used to determine which of a set of schemas a payload is expected to satisfy. See Composition and Inheritance for more details. */
  discriminator: Type.Optional(DiscriminatorObjectRef),
  /** Whether the schema is read-only. */
  readOnly: Type.Optional(Type.Boolean()),
  /** Whether the schema is write-only. */
  writeOnly: Type.Optional(Type.Boolean()),
  /** This MAY be used only on property schemas. It has no effect on root schemas. Adds additional metadata to describe the XML representation of this property. */
  xml: Type.Optional(XMLObjectRef),
  /** Additional external documentation for this schema. */
  externalDocs: Type.Optional(ExternalDocumentationObjectRef),
  /**
   * A free-form field to include an example of an instance for this schema. To represent examples that cannot be naturally represented in JSON or YAML, a string value can be used to contain the example with escaping where necessary.
   *
   * @deprecated The example field has been deprecated in favor of the JSON Schema examples keyword. Use of example is discouraged, and later versions of this specification may remove it.
   */
  example: Type.Optional(Type.Unknown()),
  /**
   * An array of examples of valid instances for this schema. This keyword follows the JSON Schema Draft 2020-12 specification.
   * Each example should be a valid instance of the schema.
   */
  examples: Type.Optional(Type.Array(Type.Unknown())),

  /** All schemas must be valid. */
  allOf: Type.Optional(Type.Array(schemaOrReference)),
  /** Exactly one schema must be valid. */
  oneOf: Type.Optional(Type.Array(schemaOrReference)),
  /** At least one schema must be valid. */
  anyOf: Type.Optional(Type.Array(schemaOrReference)),
  /** Schema must not be valid. */
  not: Type.Optional(schemaOrReference),
})

const ArrayValidationPropertiesWithSchema = Type.Object({
  type: Type.Literal('array'),
  /** Maximum number of items in array. */
  maxItems: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Minimum number of items in array. */
  minItems: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Whether array items must be unique. */
  uniqueItems: Type.Optional(Type.Boolean()),
  /** Schema for array items. */
  items: Type.Optional(schemaOrReference),
  /** Schema for tuple validation. */
  prefixItems: Type.Optional(Type.Array(schemaOrReference)),
})

const ObjectValidationPropertiesWithSchema = Type.Object({
  type: Type.Literal('object'),
  /** Maximum number of properties. */
  maxProperties: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Minimum number of properties. */
  minProperties: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Array of required property names. */
  required: Type.Optional(Type.Array(Type.String())),
  /** Object property definitions. */
  properties: Type.Optional(Type.Record(Type.String(), schemaOrReference)),
  /** Schema for additional properties. */
  additionalProperties: Type.Optional(Type.Union([Type.Boolean(), schemaOrReference])),
  /** Properties matching regex patterns. */
  patternProperties: Type.Optional(Type.Record(Type.String(), schemaOrReference)),
})

const Extensions = compose(
  XScalarIgnoreSchema,
  XInternalSchema,
  XVariableSchema,
  XEnumDescriptionsSchema,
  XEnumVarNamesSchema,
  XAdditionalPropertiesNameSchema,
  XTags,
)

/** Builds the recursive schema schema */
export const SchemaObjectSchemaDefinition = Type.Union([
  // Keep compositions first so they get priority when union is evaluated
  // Make sure there is always a required field so not all properties are optional
  // When all properties are optional (1) typescript will not throw any warnings/error and accepts anything
  // even a non resolved ref and (2) it will match any schema so it will not validate the refs correctly
  compose(Type.Object({ _: Type.String() }), CorePropertiesWithSchema, Extensions),
  compose(OtherTypes, CorePropertiesWithSchema, Extensions),
  compose(NumericProperties, CorePropertiesWithSchema, Extensions),
  compose(StringValidationProperties, CorePropertiesWithSchema, Extensions),
  compose(ObjectValidationPropertiesWithSchema, CorePropertiesWithSchema, Extensions),
  compose(ArrayValidationPropertiesWithSchema, CorePropertiesWithSchema, Extensions),
])
