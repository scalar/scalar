import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

export function isOpenAuthPasswordGrantRequired(
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

  // Check if one of them is OpenAuth2 Password Grant
  const passwordGrantRequired =
    allowedSecuritySchemes?.findIndex((securitySchemeKey: string) => {
      const securityScheme =
        schema?.components?.securitySchemes?.[securitySchemeKey]

      return (
        securityScheme?.type === 'oauth2' &&
        securityScheme?.flows?.password !== undefined
      )
    }) >= 0

  return passwordGrantRequired
}
