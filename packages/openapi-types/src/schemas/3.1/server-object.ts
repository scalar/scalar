import { z } from 'zod'
import { ServerVariableObjectSchema } from './server-variable-object'

/**
 * Server Object
 *
 * An object representing a Server.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#server-object
 */
export const ServerObjectSchema = z.object({
  /**
   * REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that
   * the host location is relative to the location where the OpenAPI document is being served. Variable substitutions
   * will be made when a variable is named in {brackets}.
   */
  url: z.string(),
  /**
   * An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description: z.string().optional(),
  /** A map between a variable name and its value. The value is used for substitution in the server's URL template. */
  variables: z.record(z.string(), ServerVariableObjectSchema).optional(),
})
