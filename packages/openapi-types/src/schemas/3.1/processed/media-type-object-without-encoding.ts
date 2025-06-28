import { z } from 'zod'
import { ExampleObjectSchema } from './example-object'
import { SchemaObjectSchema } from './schema-object'

/**
 * Media Type Object (without encoding)
 *
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#media-type-object
 */
export const MediaTypeObjectSchemaWithoutEncoding = z.object({
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
  examples: z.record(z.string(), ExampleObjectSchema).optional(),
  // Note: Don't add `encoding` here.
  // The MediaTypeObjectSchema is used in multiple places. And when it's used in headers, we don't want the encoding.
  // That's what the OpenAPI specification says.
})
