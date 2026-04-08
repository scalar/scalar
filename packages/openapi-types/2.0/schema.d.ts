import type { ExternalDocsObject } from './external-docs'
import type { XmlObject } from './xml'
export type Extensions = Record<`x-${string}`, unknown>
/**
 * Schema object
 *
 * A deterministic version of a JSON Schema object as defined by the Swagger 2.0 specification. Supports a subset of JSON Schema draft-04 properties plus Swagger-specific extensions.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#schema-object}
 */
export type SchemaObject = {
  $ref?: string
  format?: string
  title?: string
  description?: string
  default?: unknown
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[]
  enum?: unknown[]
  additionalProperties?: SchemaObject | boolean
  type?: string | string[]
  items?: SchemaObject | SchemaObject[]
  allOf?: SchemaObject[]
  properties?: Record<string, SchemaObject>
  /** The name of the discriminator property. In Swagger 2.0, discriminator is a plain string (the property name), not an object. */
  discriminator?: string
  readOnly?: boolean
  xml?: XmlObject
  externalDocs?: ExternalDocsObject
  example?: unknown
} & Extensions
