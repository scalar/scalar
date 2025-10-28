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
  contentType: z.string().optional(),
  /**
   * A map allowing additional information to be provided as headers. Content-Type is described separately and SHALL be
   * ignored in this section. This field SHALL be ignored if the request body media type is not a multipart.
   */
  headers: z.record(z.string(), HeaderObjectSchema).optional(),
  /**
   * Describes how a specific property value will be serialized depending on its type. See Parameter Object for details
   * on the style property. The behavior follows the same values as query parameters, including default values. This
   * property SHALL be ignored if the request body media type is not application/x-www-form-urlencoded or
   * multipart/form-data. If a value is explicitly defined, then the value of contentType (implicit or explicit) SHALL
   * be ignored.
   */
  style: z.enum(['form', 'spaceDelimited', 'pipeDelimited', 'deepObject']).optional(),
  /**
   * When this is true, property values of type array or object generate separate parameters for each value of the array,
   * or key-value-pair of the map. For other types of properties this property has no effect. When style is form, the
   * default value is true. For all other styles, the default value is false. This property SHALL be ignored if the
   * request body media type is not application/x-www-form-urlencoded or multipart/form-data. If a value is explicitly
   * defined, then the value of contentType (implicit or explicit) SHALL be ignored.
   */
  explode: z.boolean().optional(),
  /**
   * Determines whether the parameter value SHOULD allow reserved characters, as defined by RFC3986 :/?#[]@!$&'()*+,;=
   * to be included without percent-encoding. The default value is false. This property SHALL be ignored if the request
   * body media type is not application/x-www-form-urlencoded or multipart/form-data. If a value is explicitly defined,
   * then the value of contentType (implicit or explicit) SHALL be ignored.
   */
  allowReserved: z.boolean().optional(),
})
