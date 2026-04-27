import type { ReferenceObject } from './reference'
export type PrimitiveSchemaType = 'null' | 'boolean' | 'string' | 'number' | 'integer' | 'object' | 'array'
export type StringFormat =
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
  | 'sf-string'
  | 'sf-token'
  | 'sf-binary'
  | 'sf-boolean'
export type NumericFormat =
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
export type SchemaReferenceType<Value> = Value | ReferenceObject
export type Extensions = Record<`x-${string}`, unknown>
type SharedProperties = {
  name?: string
  title?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  const?: unknown
  examples?: unknown[]
  example?: unknown
  deprecated?: boolean
  discriminator?: Record<string, unknown>
  readOnly?: boolean
  writeOnly?: boolean
  xml?: Record<string, unknown>
  externalDocs?: Record<string, unknown>
  allOf?: SchemaReferenceType<SchemaObject>[]
  oneOf?: SchemaReferenceType<SchemaObject>[]
  anyOf?: SchemaReferenceType<SchemaObject>[]
  not?: SchemaReferenceType<SchemaObject>
  if?: SchemaReferenceType<SchemaObject>
  then?: SchemaReferenceType<SchemaObject>
  else?: SchemaReferenceType<SchemaObject>
  $defs?: Record<string, SchemaReferenceType<SchemaObject>>
}
type NumericKeywords = {
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: number
  minimum?: number
  exclusiveMinimum?: number
}
type StringKeywords = {
  maxLength?: number
  minLength?: number
  pattern?: string
  contentMediaType?: string
  contentEncoding?: string
  contentSchema?: SchemaReferenceType<SchemaObject>
}
type ArrayKeywords = {
  items?: SchemaReferenceType<SchemaObject>
  prefixItems?: SchemaReferenceType<SchemaObject>[]
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  contains?: SchemaReferenceType<SchemaObject>
  maxContains?: number
  minContains?: number
  unevaluatedItems?: boolean | SchemaReferenceType<SchemaObject>
}
type ObjectKeywords = {
  maxProperties?: number
  minProperties?: number
  required?: string[]
  properties?: Record<string, SchemaReferenceType<SchemaObject>>
  additionalProperties?: boolean | SchemaReferenceType<SchemaObject>
  patternProperties?: Record<string, SchemaReferenceType<SchemaObject>>
  dependentSchemas?: Record<string, SchemaReferenceType<SchemaObject>>
  propertyNames?: SchemaReferenceType<SchemaObject>
  unevaluatedProperties?: boolean | SchemaReferenceType<SchemaObject>
}
type UntypedObject = SharedProperties & {
  type?: undefined
  format?: StringFormat | NumericFormat
} & Extensions
type OtherTypes = SharedProperties & {
  type: 'null' | 'boolean'
} & Extensions
type NumericObject = SharedProperties &
  NumericKeywords & {
    type: 'number' | 'integer'
    format?: NumericFormat
  } & Extensions
type StringObject = SharedProperties &
  StringKeywords & {
    type: 'string'
    format?: StringFormat
  } & Extensions
type ArrayObject = SharedProperties &
  ArrayKeywords & {
    type: 'array'
  } & Extensions
type ObjectObject = SharedProperties &
  ObjectKeywords & {
    type: 'object'
  } & Extensions
export type MultiTypeObject = SharedProperties &
  NumericKeywords &
  StringKeywords &
  ArrayKeywords &
  ObjectKeywords & {
    type?: PrimitiveSchemaType | PrimitiveSchemaType[]
    format?: StringFormat | NumericFormat
  } & Extensions
export type SchemaObject =
  | UntypedObject
  | OtherTypes
  | NumericObject
  | StringObject
  | ObjectObject
  | ArrayObject
  | MultiTypeObject
export {}
