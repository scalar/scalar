import { z } from 'zod'
import { MediaTypeObjectSchema as OriginalMediaTypeObjectSchema } from '../processed/media-type-object'
import { ExampleObjectSchema } from './example-object'
import { ReferenceObjectSchema } from './reference-object'

/**
 * Media Type Object
 *
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#media-type-object
 */
export const MediaTypeObjectSchema = OriginalMediaTypeObjectSchema.extend({
  /**
   * Examples of the media type. Each example object SHOULD match the media type and specified schema if present.
   * The examples field is mutually exclusive of the example field. Furthermore, if referencing a schema which contains
   * an example, the examples value SHALL override the example provided by the schema.
   */
  examples: z.record(z.string(), z.union([ReferenceObjectSchema, ExampleObjectSchema])).optional(),
})
