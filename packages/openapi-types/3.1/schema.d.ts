import type { ReferenceObject } from './reference.js'
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
/** JSON Schema keywords apply independently of the declared instance type. */
type SharedProperties = NumericKeywords &
  StringKeywords &
  ArrayKeywords &
  ObjectKeywords & {
    /** OpenAPI permits keywords from other vocabularies, including custom keywords. */
    [keyword: string]: unknown
    $schema?: string
    $id?: string
    $anchor?: string
    $dynamicAnchor?: string
    $dynamicRef?: string
    $ref?: string
    $comment?: string
    $vocabulary?: Record<string, boolean>
    /** Keep known formats suggested while accepting custom format annotations. */
    format?: StringFormat | NumericFormat | (string & {})
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
    allOf?: SchemaObject[]
    oneOf?: SchemaObject[]
    anyOf?: SchemaObject[]
    not?: SchemaObject
    if?: SchemaObject
    then?: SchemaObject
    else?: SchemaObject
    $defs?: Record<string, SchemaObject>
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
  contentSchema?: SchemaObject
}
type ArrayKeywords = {
  items?: SchemaObject
  prefixItems?: SchemaObject[]
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  contains?: SchemaObject
  maxContains?: number
  minContains?: number
  unevaluatedItems?: boolean | SchemaObject
}
type ObjectKeywords = {
  maxProperties?: number
  minProperties?: number
  required?: string[]
  properties?: Record<string, SchemaObject>
  additionalProperties?: boolean | SchemaObject
  patternProperties?: Record<string, SchemaObject>
  dependentRequired?: Record<string, string[]>
  dependentSchemas?: Record<string, SchemaObject>
  propertyNames?: SchemaObject
  unevaluatedProperties?: boolean | SchemaObject
}
type UntypedObject = SharedProperties & {
  type?: undefined
}
type OtherTypes = SharedProperties & {
  type: 'null' | 'boolean'
}
type NumericObject = SharedProperties & {
  type: 'number' | 'integer'
}
type StringObject = SharedProperties & {
  type: 'string'
}
type ArrayObject = SharedProperties & {
  type: 'array'
}
type ObjectObject = SharedProperties & {
  type: 'object'
}
/** A schema that accepts multiple instance types, such as an object or null. */
export type MultiTypeObject = SharedProperties & {
  type: PrimitiveSchemaType[]
}
/** An OpenAPI Schema Object, including boolean schemas and JSON Schema keywords. */
export type SchemaObject =
  | boolean
  | UntypedObject
  | OtherTypes
  | NumericObject
  | StringObject
  | ObjectObject
  | ArrayObject
  | MultiTypeObject
export {}
