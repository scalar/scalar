import { z } from 'zod'
import { securitySchemeSchema } from '@scalar/types/entities'
import { cleanSchema } from '@/utils/clean-schema.ts'

const _authenticationConfigurationSchema = cleanSchema(securitySchemeSchema)

/**
 * Authentication Configuration
 * This allows us to overwrite and value that we support for any security scheme component
 */
export const authenticationConfigurationSchema = z
  .object({
    /** You can pre-select a single security scheme, multiple, or complex security using an array of arrays */
    preferredSecurityScheme: z
      .union([z.string(), z.array(z.union([z.string(), z.array(z.string())]))])
      .nullable()
      .optional(),
  })
  .catchall(_authenticationConfigurationSchema)

export type AuthenticationConfiguration = z.infer<typeof authenticationConfigurationSchema>
