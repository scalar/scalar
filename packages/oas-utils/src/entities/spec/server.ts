import { nanoidSchema } from '@/entities/shared'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { type ZodSchema, z } from 'zod'

/**
 * Server variables
 * An object representing a Server Variable for server URL template substitution.
 *
 * @see https://spec.openapis.org/oas/v3.1.0#server-variable-object
 *
 * NOTE: Typecase is required to handle enum string array type
 */
export const oasServerVariableSchema = z.object({
  /**
   * An enumeration of string values to be used if the substitution options are from a limited set.
   * The array MUST NOT be empty.
   */
  enum: z.string().array().min(1).optional(),
  /**
   * REQUIRED. The default value to use for substitution, which SHALL be sent if an alternate value is not supplied.
   * Note this behavior is different than the Schema Object’s treatment of default values, because in those cases
   * parameter values are optional. If the enum is defined, the value MUST exist in the enum’s values.
   */
  default: z.string().optional(),
  description: z.string().optional(),
}) as ZodSchema<
  Omit<OpenAPIV3_1.ServerVariableObject, 'enum'> & {
    enum?: [string, ...string[]]
  }
>

export const oasServerSchema = z.object({
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
  variables: z.record(z.string(), oasServerVariableSchema).optional(),
}) satisfies ZodSchema<OpenAPIV3_1.ServerObject>

export const serverSchema = oasServerSchema.extend({
  uid: nanoidSchema,
})

export type Server = z.infer<typeof serverSchema>
export type ServerPayload = z.input<typeof serverSchema>
