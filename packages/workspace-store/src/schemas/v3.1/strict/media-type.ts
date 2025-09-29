import { Type } from '@scalar/typebox'

import type { EncodingObject } from './encoding'
import type { ExampleObject } from './example'
import { EncodingObjectRef, ExampleObjectRef, SchemaObjectRef } from './ref-definitions'
import { type ReferenceObject, reference } from './reference'
import type { SchemaObject } from './schema'

/**
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * When example or examples are provided, the example SHOULD match the specified schema and be in the correct format as specified by the media type and its encoding. The example and examples fields are mutually exclusive, and if either is present it SHALL override any example in the schema. See Working With Examples for further guidance regarding the different ways of specifying examples, including non-JSON/YAML values.
 */
export const MediaTypeObjectSchemaDefinition = Type.Object({
  /** The schema defining the content of the request, response, parameter, or header. */
  schema: Type.Optional(Type.Union([SchemaObjectRef, reference(SchemaObjectRef)])),
  /** Example of the media type */
  example: Type.Optional(Type.Any()),
  /** Examples of the media type */
  examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObjectRef, reference(ExampleObjectRef)]))),
  /** A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property. The encoding field SHALL only apply to Request Body Objects, and only when the media type is multipart or application/x-www-form-urlencoded. If no Encoding Object is provided for a property, the behavior is determined by the default values documented for the Encoding Object. */
  encoding: Type.Optional(Type.Record(Type.String(), EncodingObjectRef)),
})

/**
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * When example or examples are provided, the example SHOULD match the specified schema and be in the correct format as specified by the media type and its encoding. The example and examples fields are mutually exclusive, and if either is present it SHALL override any example in the schema. See Working With Examples for further guidance regarding the different ways of specifying examples, including non-JSON/YAML values.
 */
export type MediaTypeObject = {
  /** The schema defining the content of the request, response, parameter, or header. */
  schema?: SchemaObject | ReferenceObject
  /** Example of the media type */
  example?: any
  /** Examples of the media type */
  examples?: Record<string, ExampleObject | ReferenceObject>
  /** A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property. The encoding field SHALL only apply to Request Body Objects, and only when the media type is multipart or application/x-www-form-urlencoded. If no Encoding Object is provided for a property, the behavior is determined by the default values documented for the Encoding Object. */
  encoding?: Record<string, EncodingObject>
}
