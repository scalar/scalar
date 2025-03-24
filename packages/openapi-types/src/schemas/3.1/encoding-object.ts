import { z } from 'zod'
import { HeaderObjectSchema } from './header-object'

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
