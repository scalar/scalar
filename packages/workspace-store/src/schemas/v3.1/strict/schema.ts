import { type Static, type TSchema, Type } from '@sinclair/typebox'
import { DiscriminatorObjectSchema } from './discriminator'
import { XMLObjectSchema } from './xml'
import { ExternalDocumentationObjectSchema } from './external-documentation'
import { ExtensionsSchema } from './extensions'
import { compose } from '@/schemas/compose'

/**
 * Builds the recursive schema schema
 *
 * We hit the typescript limit if we type this out correctly with the sub schemas (string, number etc)
 * also the commented bits are too complex for typescript so we just type them in the type instead of the schema
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
      format: Type.Optional(
        Type.String(),
        // Too complex for typescript
        // Type.Union([
        //   // Date and time formats
        //   Type.Literal('date'),
        //   Type.Literal('date-time'),
        //   Type.Literal('date-time-local'),
        //   Type.Literal('time'),
        //   Type.Literal('time-local'),
        //   Type.Literal('duration'),
        //   Type.Literal('http-date'),
        //   // Network formats
        //   Type.Literal('email'),
        //   Type.Literal('idn-email'),
        //   Type.Literal('hostname'),
        //   Type.Literal('idn-hostname'),
        //   Type.Literal('ipv4'),
        //   Type.Literal('ipv6'),
        //   Type.Literal('uri'),
        //   Type.Literal('uri-reference'),
        //   Type.Literal('uri-template'),
        //   Type.Literal('iri'),
        //   Type.Literal('iri-reference'),
        //   Type.Literal('uuid'),
        //   // Content formats
        //   Type.Literal('binary'),
        //   Type.Literal('byte'),
        //   Type.Literal('base64url'),
        //   Type.Literal('html'),
        //   Type.Literal('commonmark'),
        //   Type.Literal('password'),
        //   Type.Literal('regex'),
        //   Type.Literal('json-pointer'),
        //   Type.Literal('relative-json-pointer'),
        //   Type.Literal('media-range'),
        //   // Character formats
        //   Type.Literal('char'),
        //   // Integer formats
        //   Type.Literal('int8'),
        //   Type.Literal('int16'),
        //   Type.Literal('int32'),
        //   Type.Literal('int64'),
        //   Type.Literal('uint8'),
        //   Type.Literal('uint16'),
        //   Type.Literal('uint32'),
        //   Type.Literal('uint64'),
        //   Type.Literal('double-int'),
        //   // Number formats
        //   Type.Literal('float'),
        //   Type.Literal('double'),
        //   Type.Literal('decimal'),
        //   Type.Literal('decimal128'),
        //   // Structured field string formats
        //   Type.Literal('sf-string'),
        //   Type.Literal('sf-token'),
        //   Type.Literal('sf-binary'),
        //   Type.Literal('sf-boolean'),
        //   Type.Literal('sf-integer'),
        //   Type.Literal('sf-decimal'),
        // ]),
      ),
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
      allOf: Type.Optional(Type.Array(schema)),
      /** Exactly one schema must be valid. */
      oneOf: Type.Optional(Type.Array(schema)),
      /** At least one schema must be valid. */
      anyOf: Type.Optional(Type.Array(schema)),
      /** Schema must not be valid. */
      not: Type.Optional(schema),

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
      contentSchema: Type.Optional(schema),
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
      items: Type.Optional(schema),
      /** Schema for tuple validation. */
      prefixItems: Type.Optional(Type.Array(schema)),

      // Object
      /** Maximum number of properties. */
      maxProperties: Type.Optional(Type.Integer({ minimum: 0 })),
      /** Minimum number of properties. */
      minProperties: Type.Optional(Type.Integer({ minimum: 0 })),
      /** Array of required property names. */
      required: Type.Optional(Type.Array(Type.String())),
      /** Object property definitions. */
      properties: Type.Optional(Type.Record(Type.String(), schema)),
      /** Schema for additional properties. */
      additionalProperties: Type.Optional(Type.Union([Type.Boolean(), schema])),
      /** Properties matching regex patterns. */
      patternProperties: Type.Optional(Type.Record(Type.String(), schema)),

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
    ExtensionsSchema,
  )

export const SchemaObjectSchema = Type.Recursive(schemaObjectSchemaBuilder)

export type SchemaObject = Omit<Static<typeof SchemaObjectSchema>, 'format'> & {
  // We add this type manually because inferring the format type is too complex for typescript
  format?:
    | 'date'
    | 'date-time'
    | 'date-time-local'
    | 'time'
    | 'time-local'
    | 'duration'
    | 'http-date'
    | 'email'
    | 'idn-email'
    | 'hostname'
    | 'idn-hostname'
    | 'ipv4'
    | 'ipv6'
    | 'uri'
    | 'uri-reference'
    | 'uri-template'
    | 'iri'
    | 'iri-reference'
    | 'uuid'
    | 'binary'
    | 'byte'
    | 'base64url'
    | 'html'
    | 'commonmark'
    | 'password'
    | 'regex'
    | 'json-pointer'
    | 'relative-json-pointer'
    | 'media-range'
    | 'char'
    | 'int8'
    | 'int16'
    | 'int32'
    | 'int64'
    | 'uint8'
    | 'uint16'
    | 'uint32'
    | 'uint64'
    | 'double-int'
    | 'float'
    | 'double'
    | 'decimal'
    | 'decimal128'
    | 'sf-string'
    | 'sf-token'
    | 'sf-binary'
    | 'sf-boolean'
    | 'sf-integer'
    | 'sf-decimal'
    | undefined
}
