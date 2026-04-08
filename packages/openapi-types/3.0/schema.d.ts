import type { DiscriminatorObject } from './discriminator'
import type { ExternalDocumentationObject } from './external-documentation'
import type { ReferenceObject } from './reference'
import type { XmlObject } from './xml'
export type PrimitiveSchemaType = 'boolean' | 'string' | 'number' | 'integer' | 'object' | 'array'
export type StringFormat =
  | 'date'
  | 'date-time'
  | 'email'
  | 'hostname'
  | 'ipv4'
  | 'ipv6'
  | 'uri'
  | 'uri-reference'
  | 'uri-template'
  | 'binary'
  | 'byte'
  | 'password'
  | 'regex'
  | 'json-pointer'
  | 'relative-json-pointer'
export type NumericFormat = 'int32' | 'int64' | 'float' | 'double'
export type SchemaReferenceType<Value> = Value | ReferenceObject
export type Extensions = Record<`x-${string}`, unknown>
type SharedProperties = {
  title?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  example?: unknown
  deprecated?: boolean
  discriminator?: DiscriminatorObject
  readOnly?: boolean
  writeOnly?: boolean
  xml?: XmlObject
  externalDocs?: ExternalDocumentationObject
  allOf?: SchemaReferenceType<SchemaObject>[]
  oneOf?: SchemaReferenceType<SchemaObject>[]
  anyOf?: SchemaReferenceType<SchemaObject>[]
  not?: SchemaReferenceType<SchemaObject>
  /** In 3.0, nullable is used instead of the null type */
  nullable?: boolean
}
type NumericKeywords = {
  multipleOf?: number
  maximum?: number
  /** In 3.0, exclusiveMaximum is a boolean modifier for maximum */
  exclusiveMaximum?: boolean
  minimum?: number
  /** In 3.0, exclusiveMinimum is a boolean modifier for minimum */
  exclusiveMinimum?: boolean
}
type StringKeywords = {
  maxLength?: number
  minLength?: number
  pattern?: string
}
type ArrayKeywords = {
  items?: SchemaReferenceType<SchemaObject>
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
}
type ObjectKeywords = {
  maxProperties?: number
  minProperties?: number
  required?: string[]
  properties?: Record<string, SchemaReferenceType<SchemaObject>>
  additionalProperties?: boolean | SchemaReferenceType<SchemaObject>
}
type UntypedObject = SharedProperties & {
  type?: undefined
  format?: StringFormat | NumericFormat | string
} & Extensions
type OtherTypes = SharedProperties & {
  type: 'boolean'
} & Extensions
type NumericObject = SharedProperties &
  NumericKeywords & {
    type: 'number' | 'integer'
    format?: NumericFormat | string
  } & Extensions
type StringObject = SharedProperties &
  StringKeywords & {
    type: 'string'
    format?: StringFormat | string
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
    type?: PrimitiveSchemaType
    format?: StringFormat | NumericFormat | string
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
