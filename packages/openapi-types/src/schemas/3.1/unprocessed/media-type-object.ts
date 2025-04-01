import { z } from 'zod'
import { MediaTypeObjectSchema as OriginalMediaTypeObjectSchema } from '../processed/media-type-object'
import { EncodingObjectSchema } from './encoding-object'
import { ExampleObjectSchema } from './example-object'
import { ReferenceObjectSchema } from './reference-object'
import { SchemaObjectSchema } from './schema-object'

/**
 * Media Type Object
 *
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#media-type-object
 */
export const MediaTypeObjectSchema = OriginalMediaTypeObjectSchema.extend({
  /**
   * The schema defining the content of the request, response, or parameter.
   */
  schema: SchemaObjectSchema.optional(),
  /**
   * Example of the media type. The example object SHOULD be in the correct format as specified by the media type.
   * The example field is mutually exclusive of the examples field. Furthermore, if referencing a schema which contains
   * an example, the example value SHALL override the example provided by the schema.
   */
  example: z.any().optional(),
  /**
   * Examples of the media type. Each example object SHOULD match the media type and specified schema if present.
   * The examples field is mutually exclusive of the example field. Furthermore, if referencing a schema which contains
   * an example, the examples value SHALL override the example provided by the schema.
   */
  examples: z.record(z.string(), z.union([ReferenceObjectSchema, ExampleObjectSchema])).optional(),
  /**
   * A map between a property name and its encoding information. The key, being the property name, MUST exist in the
   * schema as a property. The encoding object SHALL only apply to requestBody objects when the media type is
   * multipart or application/x-www-form-urlencoded.
   */
  encoding: z.record(z.string(), EncodingObjectSchema).optional(),
})
