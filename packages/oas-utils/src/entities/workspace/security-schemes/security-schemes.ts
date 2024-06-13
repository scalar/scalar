import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { z } from 'zod'

const securityScheme = z.object({
  /** REQUIRED. The type of the security scheme. Valid values are "apiKey", "http", "mutualTLS", "oauth2",
   * "openIdConnect". */
  type: z.enum(['apiKey', 'http', 'mutualTLS', 'oauth2']),
})

export const createSecurityScheme = (
  payload: OpenAPIV3_1.SecuritySchemeObject | any,
) => {
  console.log(payload)
  return securityScheme.parse({})
}
