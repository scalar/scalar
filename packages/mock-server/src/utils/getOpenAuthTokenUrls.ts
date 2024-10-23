import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Extract path from URL
 */
export function getPathFromUrl(url: string): string {
  try {
    const urlObject = new URL(url)

    return urlObject.pathname
  } catch (error) {
    // If URL is invalid, return the original string
    return url
  }
}

/**
 * Returns all token URLs mentioned in the securitySchemes, without the domain
 */
export function getOpenAuthTokenUrls(schema?: OpenAPI.Document): string[] {
  if (!schema?.components?.securitySchemes) {
    return []
  }

  const securitySchemes: Record<
    string,
    OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject
  > = schema.components.securitySchemes

  // Array to store all found token URLs
  const tokenUrls: string[] = []

  // Iterate through all security schemes
  for (const scheme of Object.values(securitySchemes)) {
    // Check if the scheme is OAuth2
    if (scheme.type !== 'oauth2') continue

    // Extract token URLs from different OAuth2 flows
    const flows = (
      scheme as
        | OpenAPIV3.OAuth2SecurityScheme
        | OpenAPIV3_1.OAuth2SecurityScheme
    ).flows

    // Check and add tokenUrl from password flow
    if (flows?.password?.tokenUrl) {
      tokenUrls.push(getPathFromUrl(flows.password.tokenUrl))
    }

    // Check and add tokenUrl from clientCredentials flow
    if (flows?.clientCredentials?.tokenUrl) {
      tokenUrls.push(getPathFromUrl(flows.clientCredentials.tokenUrl))
    }

    // Check and add tokenUrl from authorizationCode flow
    if (flows?.authorizationCode?.tokenUrl) {
      tokenUrls.push(getPathFromUrl(flows.authorizationCode.tokenUrl))
    }

    // Note: Implicit flow doesn't have a tokenUrl
  }

  // Remove duplicates and return the array of token URLs
  return [...new Set(tokenUrls)]
}
