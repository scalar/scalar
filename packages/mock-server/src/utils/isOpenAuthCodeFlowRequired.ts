import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

export function isOpenAuthCodeFlowRequired(
  operation: OpenAPI.Operation,
  schema?: OpenAPI.Document,
): boolean {
  const allowedSecuritySchemes = operation.security?.map(
    (
      securityScheme:
        | OpenAPIV3.SecurityRequirementObject
        | OpenAPIV3_1.SecurityRequirementObject,
    ) => {
      return Object.keys(securityScheme)[0]
    },
  )

  // Check if one of them is OAuth 2.0 with Authorization Code flow
  const oauthCodeFlowIsRequired = allowedSecuritySchemes?.some(
    (securitySchemeKey: string) => {
      const securityScheme = schema?.components?.securitySchemes?.[
        securitySchemeKey
      ] as
        | OpenAPIV3.OAuth2SecurityScheme
        | OpenAPIV3_1.OAuth2SecurityScheme
        | undefined

      return (
        securityScheme?.type === 'oauth2' &&
        securityScheme?.flows?.authorizationCode !== undefined
      )
    },
  )

  return oauthCodeFlowIsRequired ?? false
}
