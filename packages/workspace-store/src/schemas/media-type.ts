import { Type } from '@sinclair/typebox'
import { ExampleObject } from './example'
import { ReferenceObject } from './reference'
import { EncodingObject } from './encoding'
import { SchemaObject } from './schema'

/**
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * When example or examples are provided, the example SHOULD match the specified schema and be in the correct format as specified by the media type and its encoding. The example and examples fields are mutually exclusive, and if either is present it SHALL override any example in the schema. See Working With Examples for further guidance regarding the different ways of specifying examples, including non-JSON/YAML values.
 */
export const MediaTypeObject = Type.Object({
  /** The schema defining the content of the request, response, parameter, or header. */
  schema: Type.Optional(SchemaObject),
  /** Example of the media type */
  example: Type.Optional(Type.Any()),
  /** Examples of the media type */
  examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObject, ReferenceObject]))),
  /** A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property. The encoding field SHALL only apply to Request Body Objects, and only when the media type is multipart or application/x-www-form-urlencoded. If no Encoding Object is provided for a property, the behavior is determined by the default values documented for the Encoding Object. */
  encoding: Type.Optional(Type.Record(Type.String(), EncodingObject)),
})
