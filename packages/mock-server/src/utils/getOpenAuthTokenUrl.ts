import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

export function getOpenAuthTokenUrl(schema?: OpenAPI.Document) {
  const securitySchemes: Record<
    string,
    OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject
  > = schema?.components?.securitySchemes

  if (securitySchemes === undefined) {
    return false
  }

  // TODO: Make this work with other OpenAuth workflows
  const openAuthPasswordGrant = Object.values(securitySchemes).filter(
    (securityScheme) => {
      if (
        securityScheme.type === 'oauth2' &&
        securityScheme.flows?.password !== undefined
      ) {
        return true
      }

      return false
    },
  )

  if (!openAuthPasswordGrant.length) {
    return undefined
  }

  // @ts-expect-error TypeScript, I know it’s there (or undefined, both is fine).
  return openAuthPasswordGrant[0]?.flows?.password?.tokenUrl as
    | undefined
    | string
}
