import { z } from 'zod'
import { HeaderObjectSchema } from './header-object'

/**
 * Encoding Object
 *
 * A single encoding definition applied to a single schema property. See Appendix B for a discussion of converting
 * values of various types to string representations.
 *
 * Properties are correlated with multipart parts using the name parameter of Content-Disposition: form-data, and with
 * application/x-www-form-urlencoded using the query string parameter names. In both cases, their order is
 * implementation-defined.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#encoding-object
 */
export const EncodingObjectSchema = z.object({
  /**
   * The Content-Type for encoding a specific property. The value is a comma-separated list, each element of which is
   * either a specific media type (e.g. image/png) or a wildcard media type (e.g. image/*). Default value depends on the
   * property type as shown in the table below.
   */
  contentType: z.string(),
  /**
   * A map allowing additional information to be provided as headers. Content-Type is described separately and SHALL be
   * ignored in this section. This field SHALL be ignored if the request body media type is not a multipart.
   */
  headers: z.record(z.string(), HeaderObjectSchema).optional(),
})
