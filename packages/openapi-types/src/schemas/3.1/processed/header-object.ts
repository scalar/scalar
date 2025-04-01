import { z } from 'zod'
import { ExampleObjectSchema } from './example-object'
import { MediaTypeObjectSchemaWithoutEncoding } from './media-type-object-without-encoding'
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
export const HeaderObjectSchema = z.object({
  /**
   * A brief description of the header. This could contain examples of use. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description: z.string().optional(),
  /**
   * Determines whether this header is mandatory. The default value is false.
   */
  required: z.boolean().optional(),
  /**
   * Specifies that the header is deprecated and SHOULD be transitioned out of usage. Default value is false.
   */
  deprecated: z.boolean().optional(),
  /**
   * Describes how the parameter value will be serialized. Only "simple" is allowed for headers.
   */
  style: z.enum(['matrix', 'label', 'simple', 'form', 'spaceDelimited', 'pipeDelimited', 'deepObject']).optional(),
  /**
   * When this is true, parameter values of type array or object generate separate parameters
   * for each value of the array or key-value pair of the map.
   */
  explode: z.boolean().optional(),
  /**
   * The schema defining the type used for the header.
   */
  schema: SchemaObjectSchema.optional(),
  /**
   * Example of the parameter's potential value.
   */
  example: z.any().optional(),
  /**
   * Examples of the parameter's potential value.
   */
  examples: z.record(z.string(), ExampleObjectSchema).optional(),
  /**
   * A map containing the representations for the parameter.
   * The key is the media type and the value describes it.
   * Only one of content or schema should be specified.
   */
  content: z.record(z.string(), MediaTypeObjectSchemaWithoutEncoding).optional(),
})
