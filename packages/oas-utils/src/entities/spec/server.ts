import { type ENTITY_BRANDS, nanoidSchema } from '@scalar/types/utils'
import { z } from 'zod'

/**
 * Server Variable Object
 *
 * An object representing a Server Variable for server URL template substitution.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#server-variable-object
 */
export const oasServerVariableSchema = z.object({
  /**
   * An enumeration of string values to be used if the substitution options are from a limited set. The array MUST NOT be empty.
   */
  enum: z.array(z.string()).optional(),
  /**
   * REQUIRED. The default value to use for substitution, which SHALL be sent if an alternate value is not supplied.
   * Note this behavior is different than the Schema Object's treatment of default values, because in those cases
   * parameter values are optional. If the enum is defined, the value MUST exist in the enum's values.
   */
  default: z.string().optional(),
  /**
   * An optional description for the server variable. CommonMark syntax MAY be used for rich text representation.
   */
  description: z.string().optional(),
})

/** Extended schema for server variables */
const extendedServerVariableSchema = oasServerVariableSchema
  .extend({
    /** The value of the variable */
    value: z.string().optional(),
  })
  .refine((data) => {
    // Set default to the first enum value if invalid
    if (Array.isArray(data.enum) && !data.enum.includes(data.default ?? '') && data.enum.length > 0) {
      data.default = data.enum[0]
    }

    if (Array.isArray(data.enum) && data.enum.length === 0) {
      delete data.enum
    }

    // Always return true since we've modified the data to be valid
    return true
  })

/**
 * Server Object
 *
 * An object representing a Server.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#server-object
 */
export const oasServerSchema = z.object({
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
  variables: z.record(z.string(), extendedServerVariableSchema).optional(),
})

export const serverSchema = oasServerSchema.extend({
  uid: nanoidSchema.brand<ENTITY_BRANDS['SERVER']>(),
})

export type Server = z.infer<typeof serverSchema>
export type ServerPayload = z.input<typeof serverSchema>
