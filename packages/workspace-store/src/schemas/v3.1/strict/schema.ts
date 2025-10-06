import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { type XInternal, XInternalSchema } from '@/schemas/extensions/document/x-internal'
import { type XScalarIgnore, XScalarIgnoreSchema } from '@/schemas/extensions/document/x-scalar-ignore'
import { XTags } from '@/schemas/extensions/document/x-tags'
import {
  type XAdditionalPropertiesName,
  XAdditionalPropertiesNameSchema,
} from '@/schemas/extensions/schema/x-additional-properties-name'
import { type XEnumDescriptions, XEnumDescriptionsSchema } from '@/schemas/extensions/schema/x-enum-descriptions'
import { type XEnumVarNames, XEnumVarNamesSchema } from '@/schemas/extensions/schema/x-enum-varnames'
import { type XVariable, XVariableSchema } from '@/schemas/extensions/schema/x-variable'
import type { ExternalDocumentationObject } from '@/schemas/v3.1/strict/external-documentation'
import type { XMLObject } from '@/schemas/v3.1/strict/xml'

import type { DiscriminatorObject } from './discriminator'
import {
  DiscriminatorObjectRef,
  ExternalDocumentationObjectRef,
  SchemaObjectRef,
  XMLObjectRef,
} from './ref-definitions'
import { type ReferenceType, reference } from './reference'

const schemaOrReference = Type.Union([SchemaObjectRef, reference(SchemaObjectRef)])

/** We use this type to ensure that we are parsing a schema object as every property can be optional */
type _InternalType = CoreProperties & {
  _: string
} & Extensions

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

type OtherType = 'boolean' | 'null' | ('string' | 'number' | 'boolean' | 'object' | 'null' | 'integer' | 'array')[]

type OtherTypes = CoreProperties & {
  type: OtherType
} & Extensions

const Extensions = compose(
  XScalarIgnoreSchema,
  XInternalSchema,
  XVariableSchema,
  XEnumDescriptionsSchema,
  XEnumVarNamesSchema,
  XAdditionalPropertiesNameSchema,
  XTags,
)

export type Extensions = XScalarIgnore &
  XInternal &
  XVariable &
  XEnumDescriptions &
  XEnumVarNames &
  XAdditionalPropertiesName &
  XTags

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

export type CoreProperties = {
  name?: string
  /** A title for the schema. */
  title?: string
  /** A description of the schema. */
  description?: string
  /** Default value for the schema. */
  default?: unknown
  /** Array of allowed values. */
  enum?: unknown[]
  /** Constant value that must match exactly. */
  const?: unknown
  /** Media type for content validation. */
  contentMediaType?: string
  /** Content encoding. */
  contentEncoding?: string
  /** Schema for content validation. */
  contentSchema?: ReferenceType<SchemaObject>
  /** Whether the schema is deprecated. */
  deprecated?: boolean
  /** Adds support for polymorphism. The discriminator is used to determine which of a set of schemas a payload is expected to satisfy. See Composition and Inheritance for more details. */
  discriminator?: DiscriminatorObject
  /** Whether the schema is read-only. */
  readOnly?: boolean
  /** Whether the schema is write-only. */
  writeOnly?: boolean
  /** This MAY be used only on property schemas. It has no effect on root schemas. Adds additional metadata to describe the XML representation of this property. */
  xml?: XMLObject
  /** Additional external documentation for this schema. */
  externalDocs?: ExternalDocumentationObject
  /**
   * A free-form field to include an example of an instance for this schema. To represent examples that cannot be naturally represented in JSON or YAML, a string value can be used to contain the example with escaping where necessary.
   *
   * @deprecated The example field has been deprecated in favor of the JSON Schema examples keyword. Use of example is discouraged, and later versions of this specification may remove it.
   */
  example?: unknown
  /**
   * An array of examples of valid instances for this schema. This keyword follows the JSON Schema Draft 2020-12 specification.
   * Each example should be a valid instance of the schema.
   */
  examples?: unknown[]
  /** All schemas must be valid. */
  allOf?: ReferenceType<SchemaObject>[]
  /** Exactly one schema must be valid. */
  oneOf?: ReferenceType<SchemaObject>[]
  /** At least one schema must be valid. */
  anyOf?: ReferenceType<SchemaObject>[]
  /** Schema must not be valid. */
  not?: ReferenceType<SchemaObject>
}

/**
 * Numeric validation properties for number and integer types.
 */
const NumericProperties = Type.Object({
  type: Type.Union([Type.Literal('number'), Type.Literal('integer')]),
  /** Different subtypes */
  format: Type.Optional(Type.String()),
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

export type NumericObject = CoreProperties & {
  type: 'number' | 'integer'
  /** Different subtypes */
  format?:
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
    | 'sf-integer'
    | 'sf-decimal'
    | (string & {})
  /** Number must be a multiple of this value. */
  multipleOf?: number
  /** Maximum value (inclusive). */
  maximum?: number
  /** Maximum value (exclusive). */
  exclusiveMaximum?: boolean | number
  /** Minimum value (inclusive). */
  minimum?: number
  /** Minimum value (exclusive). */
  exclusiveMinimum?: boolean | number
} & Extensions

/**
 * String validation properties for string types.
 */
const StringValidationProperties = Type.Object({
  type: Type.Literal('string'),
  /** Different subtypes - allow any arbitrary string, this negates the purpose of having a union of formats so we type it in typescript instead */
  format: Type.Optional(Type.String()),
  /** Maximum string length. */
  maxLength: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Minimum string length. */
  minLength: Type.Optional(Type.Integer({ minimum: 0 })),
  /** Regular expression pattern. */
  pattern: Type.Optional(Type.String()),
})

/**
 * Supported string formats in OpenAPI schemas.
 *
 * These provide better type safety for string format validation. We wanted to allow any arbitrary string
 * in the schema, so we type it in typescript instead. This gives us autocomplete while allowing any string!
 */
export type StringFormat =
  // Date and time formats
  | 'date'
  | 'date-time'
  | 'date-time-local'
  | 'time'
  | 'time-local'
  | 'duration'
  | 'http-date'
  // Network formats
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
  // Content formats
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
  // Character formats
  | 'char'
  // Structured field string formats
  | 'sf-string'
  | 'sf-token'
  | 'sf-binary'
  | 'sf-boolean'
  | (string & {})

export type StringObject = CoreProperties & {
  type: 'string'
  /** Different subtypes - allow any arbitrary string, this negates the purpose of having a union of formats so we type it in typescript instead */
  format?: StringFormat
  /** Maximum string length. */
  maxLength?: number
  /** Minimum string length. */
  minLength?: number
  /** Regular expression pattern. */
  pattern?: string
} & Extensions

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

export type ArrayObject = CoreProperties & {
  type: 'array'
  /** Maximum number of items in array. */
  maxItems?: number
  /** Minimum number of items in array. */
  minItems?: number
  /** Whether array items must be unique. */
  uniqueItems?: boolean
  /** Schema for array items. */
  items?: ReferenceType<SchemaObject>
  /** Schema for tuple validation. */
  prefixItems?: ReferenceType<SchemaObject>[]
} & Extensions

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

export type ObjectObject = CoreProperties & {
  type: 'object'
  /** Maximum number of properties. */
  maxProperties?: number
  /** Minimum number of properties. */
  minProperties?: number
  /** Array of required property names. */
  required?: string[]
  /** Object property definitions. */
  properties?: Record<string, ReferenceType<SchemaObject>>
  /** Schema for additional properties. */
  additionalProperties?: boolean | ReferenceType<SchemaObject>
  /** Properties matching regex patterns. */
  patternProperties?: Record<string, ReferenceType<SchemaObject>>
} & Extensions

/** Builds the recursive schema schema */
export const SchemaObjectSchemaDefinition = Type.Union([
  // Keep compositions first so they get priority when union is evaluated
  // Make sure there is always a required field so not all properties are optional
  // When all properties are optional (1) typescript will not throw any warnings/error and accepts anything
  // even a non resolved ref and (2) it will match any schema so it will not validate the refs correctly
  compose(Type.Object({ __scalar_: Type.String() }), CorePropertiesWithSchema, Extensions),
  compose(OtherTypes, CorePropertiesWithSchema, Extensions),
  compose(NumericProperties, CorePropertiesWithSchema, Extensions),
  compose(StringValidationProperties, CorePropertiesWithSchema, Extensions),
  compose(ObjectValidationPropertiesWithSchema, CorePropertiesWithSchema, Extensions),
  compose(ArrayValidationPropertiesWithSchema, CorePropertiesWithSchema, Extensions),
])

export type SchemaObject = _InternalType | OtherTypes | NumericObject | StringObject | ObjectObject | ArrayObject
