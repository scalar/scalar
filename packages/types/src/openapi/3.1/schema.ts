import type { XInternal } from '@scalar/types/extensions/document/x-internal'
import type { XScalarIgnore } from '@scalar/types/extensions/document/x-scalar-ignore'
import type { XTags } from '@scalar/types/extensions/document/x-tags'
import type { XAdditionalPropertiesName } from '@scalar/types/extensions/schema/x-additional-properties-name'
import type { XEnumDescriptions } from '@scalar/types/extensions/schema/x-enum-descriptions'
import type { XEnumVarNames } from '@scalar/types/extensions/schema/x-enum-varnames'
import type { XExamples } from '@scalar/types/extensions/schema/x-examples'
import type { XVariable } from '@scalar/types/extensions/schema/x-variable'
import type { ExternalDocumentationObject } from './external-documentation'
import type { XMLObject } from './xml'
import type { DiscriminatorObject } from './discriminator'
import type { ReferenceObject } from './reference'

export type SchemaReferenceType<Value> = Value | (ReferenceObject & { '$ref-value': unknown })

type Extensions = XScalarIgnore &
  XInternal &
  XVariable &
  XEnumDescriptions &
  XEnumVarNames &
  XExamples &
  XAdditionalPropertiesName &
  XTags

type CoreProperties = {
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
  contentSchema?: SchemaReferenceType<SchemaObject>
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
  allOf?: SchemaReferenceType<SchemaObject>[]
  /** Exactly one schema must be valid. */
  oneOf?: SchemaReferenceType<SchemaObject>[]
  /** At least one schema must be valid. */
  anyOf?: SchemaReferenceType<SchemaObject>[]
  /** Schema must not be valid. */
  not?: SchemaReferenceType<SchemaObject>
}

type _InternalType = CoreProperties & {
  __scalar_: string
} & Extensions

/**
 * Primitive types that don't have additional validation properties.
 * These types (null, boolean, string, number, integer, object, array) can be used
 * without additional validation constraints.
 *
 * TODO: Type array will actually validate against every union type but we can cross that bridge when we come to it
 */
type OtherType = 'boolean' | 'null' | ('string' | 'number' | 'boolean' | 'object' | 'null' | 'integer' | 'array')[]

type OtherTypes = CoreProperties & {
  type: OtherType
} & Extensions

/**
 * Numeric validation properties for number and integer types.
 */
type NumericObject = CoreProperties & {
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
  exclusiveMaximum?: number
  /** Minimum value (inclusive). */
  minimum?: number
  /** Minimum value (exclusive). */
  exclusiveMinimum?: number
} & Extensions

/**
 * String validation properties for string types.
 */
type StringFormat =
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

type StringObject = CoreProperties & {
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

type ArrayObject = CoreProperties & {
  type: 'array'
  /** Maximum number of items in array. */
  maxItems?: number
  /** Minimum number of items in array. */
  minItems?: number
  /** Whether array items must be unique. */
  uniqueItems?: boolean
  /** Schema for array items. */
  items?: SchemaReferenceType<SchemaObject>
  /** Schema for tuple validation. */
  prefixItems?: SchemaReferenceType<SchemaObject>[]
} & Extensions

type ObjectObject = CoreProperties & {
  type: 'object'
  /** Maximum number of properties. */
  maxProperties?: number
  /** Minimum number of properties. */
  minProperties?: number
  /** Array of required property names. */
  required?: string[]
  /** Object property definitions. */
  properties?: Record<string, SchemaReferenceType<SchemaObject>>
  /** Schema for additional properties. */
  additionalProperties?: boolean | SchemaReferenceType<SchemaObject>
  /** Properties matching regex patterns. */
  patternProperties?: Record<string, SchemaReferenceType<SchemaObject>>
  /** Constraints on property names (JSON Schema propertyNames keyword). */
  propertyNames?: SchemaReferenceType<SchemaObject>
} & Extensions

export type SchemaObject = _InternalType | OtherTypes | NumericObject | StringObject | ObjectObject | ArrayObject
export type MaybeRefSchemaObject = SchemaReferenceType<SchemaObject>

