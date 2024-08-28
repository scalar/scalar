import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

export function isBasicAuthenticationRequired(
  operation: OpenAPI.Operation,
  schema?: OpenAPI.Document,
) {
  const allowedSecuritySchemes = operation.security?.map(
    (
      securityScheme:
        | OpenAPIV3.SecurityRequirementObject
        | OpenAPIV3_1.SecurityRequirementObject,
    ) => {
      return Object.keys(securityScheme)[0]
    },
  )

  // Check if one of them is HTTP Basic Auth
  const httpBasicAuthIsRequired =
    allowedSecuritySchemes?.findIndex((securitySchemeKey: string) => {
      const securityScheme =
        schema?.components?.securitySchemes?.[securitySchemeKey]

      return (
        securityScheme?.type === 'http' && securityScheme?.scheme === 'basic'
      )
    }) >= 0

  return httpBasicAuthIsRequired
}
