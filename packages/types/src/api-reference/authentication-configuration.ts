import { z } from 'zod'

import { securitySchemeSchema } from '@/entities/security-scheme.ts'
import { zodDeepPartial } from '@/utils/zod-deep-partial.ts'

const partialSecuritySchemeSchema = zodDeepPartial(securitySchemeSchema)

/**
 * Authentication Configuration
 * This allows us to overwrite and value that we support for any security scheme component
 */
export const authenticationConfigurationSchema = z.object({
  /**
   * Specifies the preferred security scheme(s) to use for authentication.
   * Can be one of:
   * - A single security scheme name (string)
   * - An array of security scheme names (OR relationship)
   * - An array containing strings or arrays of strings (AND/OR relationship)
   */
  preferredSecurityScheme: z
    .union([z.string(), z.array(z.union([z.string(), z.array(z.string()).min(1)])).min(1)])
    .nullable()
    .optional(),
  securitySchemes: z.record(z.string(), partialSecuritySchemeSchema).optional(),
})

export type AuthenticationConfiguration = z.infer<typeof authenticationConfigurationSchema>
