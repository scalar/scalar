import { deepMerge } from '@/helpers'
import { z } from 'zod'

import { nanoidSchema } from '../shared'

/**
 * Server variables
 * An object representing a Server Variable for server URL template substitution.
 *
 * @see https://spec.openapis.org/oas/v3.1.0#server-variable-object
 */
const serverVariableSchema = z.object({
  uid: nanoidSchema,
  /**
   * An enumeration of string values to be used if the substitution options are from a limited set.
   * The array MUST NOT be empty.
   */
  enum: z.array(z.string()).optional(),
  /**
   * REQUIRED. The default value to use for substitution, which SHALL be sent if an alternate value is not supplied.
   * Note this behavior is different than the Schema Object’s treatment of default values, because in those cases
   * parameter values are optional. If the enum is defined, the value MUST exist in the enum’s values.
   */
  default: z.string().optional().default('default'),
  /** An optional description for the server variable. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
})

const serverSchema = z.object({
  uid: nanoidSchema,
  /**
   * REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that
   * the host location is relative to the location where the OpenAPI document is being served. Variable substitutions
   * will be made when a variable is named in {brackets}.
   */
  url: z.string().optional().default(''),
  /**
   * An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text
   * representation.
   */
  description: z.string().optional(),
  /** A map between a variable name and its value. The value is used for substitution in the server’s URL template. */
  variables: z.record(z.string(), serverVariableSchema).nullable().optional(),
})

/**
 * Server object
 * An object representing a Server.
 *
 * @see https://spec.openapis.org/oas/v3.1.0#server-object
 */
export type Server = z.infer<typeof serverSchema>
export type ServerPayload = z.input<typeof serverSchema>

/** Create server helper */
export const createServer = (payload: ServerPayload) =>
  deepMerge(serverSchema.parse({}), payload)
