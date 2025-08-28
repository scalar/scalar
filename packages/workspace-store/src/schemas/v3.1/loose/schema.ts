import { Type, type TSchema } from '@scalar/typebox'

import { DiscriminatorObjectSchema } from './discriminator'
import { XMLObjectSchema } from './xml'
import { ExternalDocumentationObjectSchema } from './external-documentation'
import { compose } from '@/schemas/compose'
import { XInternalSchema } from '@/schemas/extensions/document/x-internal'
import { XScalarIgnoreSchema } from '@/schemas/extensions/document/x-scalar-ignore'
import { ReferenceObjectSchema } from '@/schemas/v3.1/strict/reference'

/**
 * Builds the recursive schema schema
 */
export const schemaObjectSchemaBuilder = <S extends TSchema>(schema: S) =>
  compose(
    Type.Object({
      // Base JSON Schema
      type: Type.Optional(
        Type.Union([
          Type.Literal('null'),
          Type.Literal('boolean'),
          Type.Literal('string'),
          Type.Literal('number'),
          Type.Literal('integer'),
          Type.Literal('object'),
          Type.Literal('array'),
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
      ),
      /** Different subtypes */
      format: Type.Optional(Type.String()),
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

      // Composition
      /** All schemas must be valid. */
      allOf: Type.Optional(Type.Array(Type.Union([schema, ReferenceObjectSchema]))),
      /** Exactly one schema must be valid. */
      oneOf: Type.Optional(Type.Array(Type.Union([schema, ReferenceObjectSchema]))),
      /** At least one schema must be valid. */
      anyOf: Type.Optional(Type.Array(Type.Union([schema, ReferenceObjectSchema]))),
      /** Schema must not be valid. */
      not: Type.Optional(Type.Union([schema, ReferenceObjectSchema])),

      // OpenAPI 3.0
      /**
       * Whether the schema is nullable.
       *
       * @deprecated this was deprecated in OpenAPI 3.1 and replaced with type: [null]
       * @see https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
       */
      nullable: Type.Optional(Type.Boolean()),

      // OpenAPI 3.1
      /** Media type for content validation. */
      contentMediaType: Type.Optional(Type.String()),
      /** Content encoding. */
      contentEncoding: Type.Optional(Type.String()),
      /** Schema for content validation. */
      contentSchema: Type.Optional(Type.Union([schema, ReferenceObjectSchema])),
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
      example: Type.Optional(Type.Unknown()),
      /**
       * An array of examples of valid instances for this schema. This keyword follows the JSON Schema Draft 2020-12 specification.
       * Each example should be a valid instance of the schema.
       */
      examples: Type.Optional(Type.Array(Type.Unknown())),

      // OpenAPI Extensions
      'x-tags': Type.Optional(Type.Array(Type.String())),

      // Array
      /** Maximum number of items in array. */
      maxItems: Type.Optional(Type.Integer({ minimum: 0 })),
      /** Minimum number of items in array. */
      minItems: Type.Optional(Type.Integer({ minimum: 0 })),
      /** Whether array items must be unique. */
      uniqueItems: Type.Optional(Type.Boolean()),
      /** Schema for array items. */
      items: Type.Optional(Type.Union([schema, ReferenceObjectSchema])),
      /** Schema for tuple validation. */
      prefixItems: Type.Optional(Type.Array(Type.Union([schema, ReferenceObjectSchema]))),

      // Object
      /** Maximum number of properties. */
      maxProperties: Type.Optional(Type.Integer({ minimum: 0 })),
      /** Minimum number of properties. */
      minProperties: Type.Optional(Type.Integer({ minimum: 0 })),
      /** Array of required property names. */
      required: Type.Optional(Type.Array(Type.String())),
      /** Object property definitions. */
      properties: Type.Optional(Type.Record(Type.String(), Type.Union([schema, ReferenceObjectSchema]))),
      /** Schema for additional properties. */
      additionalProperties: Type.Optional(Type.Union([Type.Boolean(), Type.Union([schema, ReferenceObjectSchema])])),
      /** Properties matching regex patterns. */
      patternProperties: Type.Optional(Type.Record(Type.String(), Type.Union([schema, ReferenceObjectSchema]))),

      // String
      /** Maximum string length. */
      maxLength: Type.Optional(Type.Integer({ minimum: 0 })),
      /** Minimum string length. */
      minLength: Type.Optional(Type.Integer({ minimum: 0 })),
      /** Regular expression pattern. */
      pattern: Type.Optional(Type.String()),

      // Number
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
    }),
    XScalarIgnoreSchema,
    XInternalSchema,
  )

export const SchemaObjectSchema = Type.Recursive(schemaObjectSchemaBuilder)
