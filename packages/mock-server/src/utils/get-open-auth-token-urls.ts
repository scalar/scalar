import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Extract path from URL
 */
export function getPathFromUrl(url: string): string {
  try {
    // Handle relative URLs by prepending a base
    const urlObject = url.startsWith('http') ? new URL(url) : new URL(url, 'http://example.com')

    // Normalize: remove trailing slash except for root path
    const path = urlObject.pathname
    return path === '/' ? path : path.replace(/\/$/, '')
  } catch {
    // If URL is invalid, return the original string
    return url
  }
}

/**
 * Returns OAuth token and refresh URLs without the domain.
 */
// Type guard for OAuth2 security scheme
function isOAuth2Scheme(
  scheme: OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject,
): scheme is OpenAPIV3.OAuth2SecurityScheme | OpenAPIV3_1.OAuth2SecurityScheme {
  return scheme.type === 'oauth2'
}

// Validate OAuth URL
function isValidOAuthUrl(url: string): boolean {
  return url.trim().length > 0
}

export function getOpenAuthTokenUrls(schema?: OpenAPI.Document): string[] {
  if (!schema?.components?.securitySchemes) {
    return []
  }

  const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject> =
    schema.components.securitySchemes

  // Use Set from the start for better memory efficiency
  const oauthUrls = new Set<string>()

  // Iterate through all security schemes
  for (const scheme of Object.values(securitySchemes)) {
    if (!isOAuth2Scheme(scheme)) {
      continue
    }

    const flows = scheme.flows // Type assertion no longer needed

    // Helper to safely add valid OAuth URLs
    const addOAuthUrl = (url?: string) => {
      if (url && isValidOAuthUrl(url)) {
        oauthUrls.add(getPathFromUrl(url))
      }
    }

    addOAuthUrl(flows?.password?.tokenUrl)
    addOAuthUrl(flows?.password?.refreshUrl)
    addOAuthUrl(flows?.clientCredentials?.tokenUrl)
    addOAuthUrl(flows?.clientCredentials?.refreshUrl)
    addOAuthUrl(flows?.authorizationCode?.tokenUrl)
    addOAuthUrl(flows?.authorizationCode?.refreshUrl)
    addOAuthUrl(flows?.implicit?.refreshUrl)
  }

  return Array.from(oauthUrls)
}
