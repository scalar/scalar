import { deepMerge } from '@/helpers'
import { z } from 'zod'

const securityScheme = z.object({
  /** REQUIRED. The type of the security scheme. Valid values are "apiKey", "http", "mutualTLS", "oauth2",
   * "openIdConnect". */
  type: z
    .enum(['apiKey', 'http', 'mutualTLS', 'oauth2'])
    .optional()
    .default('apiKey'),
})

/** Folders will correspond to the x- */
export type SecurityScheme = z.infer<typeof securityScheme>
export type SecuritySchemePayload = z.input<typeof securityScheme>

/** Create Security Scheme with defaults */
export const createSecurityScheme = (payload: SecuritySchemePayload) =>
  deepMerge(securityScheme.parse({}), payload)
