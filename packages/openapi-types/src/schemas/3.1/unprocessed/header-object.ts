import { z } from 'zod'
import { HeaderObjectSchema as OriginalHeaderObjectSchema } from '../processed/header-object'
import { ExampleObjectSchema } from './example-object'
import { MediaTypeObjectSchemaWithoutEncoding } from './media-type-object-without-encoding'
import { ReferenceObjectSchema } from './reference-object'
import { SchemaObjectSchema } from './schema-object'

/**
 * Header Object
 *
 * Describes a single header for HTTP responses and for individual parts in multipart representations; see the relevant
 *  Response Object and Encoding Object documentation for restrictions on which headers can be described.
 *
 * The Header Object follows the structure of the Parameter Object, including determining its serialization strategy
 * based on whether schema or content is present, with the following changes:
 *
 * - name MUST NOT be specified, it is given in the corresponding headers map.
 * - in MUST NOT be specified, it is implicitly in header.
 * - All traits that are affected by the location MUST be applicable to a location of header (for example, style).
 *   This means that allowEmptyValue and allowReserved MUST NOT be used, and style, if used, MUST be limited to
 *   "simple".
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#header-object
 */
export const HeaderObjectSchema = OriginalHeaderObjectSchema.extend({
  /**
   * The schema defining the type used for the header.
   */
  schema: SchemaObjectSchema.optional(),
  /**
   * Examples of the parameter's potential value.
   */
  examples: z.record(z.string(), z.union([ReferenceObjectSchema, ExampleObjectSchema])).optional(),
  /**
   * A map containing the representations for the parameter.
   * The key is the media type and the value describes it.
   * Only one of content or schema should be specified.
   */
  content: z.record(z.string(), MediaTypeObjectSchemaWithoutEncoding).optional(),
})
