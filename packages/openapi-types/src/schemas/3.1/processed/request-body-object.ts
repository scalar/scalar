import { z } from 'zod'
import { EncodingObjectSchema } from './encoding-object'
import { MediaTypeObjectSchema } from './media-type-object'

/**
 * Request Body Object
 *
 * Describes a single request body.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#request-body-object
 */
export const RequestBodyObjectSchema = z.object({
  /**
   * A brief description of the request body. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.
   */
  description: z.string().optional(),
  /**
   * REQUIRED. The content of the request body. The key is a media type or media type range and the value describes it. For requests that match multiple keys, only the most specific key is applicable. e.g. "text/plain" overrides "text/*"
   */
  content: z.record(z.string(), MediaTypeObjectSchema),
  /**
   * Determines if the request body is required in the request. Defaults to false.
   */
  required: z.boolean().optional(),
  /**
   * Only mentioned in the example:
   *
   * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#request-body-object
   */
  encoding: z.record(z.string(), EncodingObjectSchema).optional(),
})
