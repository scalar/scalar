import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

import { isOauth2SecurityScheme, isReferenceObject } from './openapi-guards'

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
 * Returns all token URLs mentioned in the securitySchemes, without the domain
 */
// Validate token URL
function isValidTokenUrl(url: string): boolean {
  return url.trim().length > 0
}

export function getOpenAuthTokenUrls(schema?: OpenAPI.Document): string[] {
  if (!schema?.components?.securitySchemes) {
    return []
  }

  const securitySchemes: Record<
    string,
    OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject | OpenAPIV3_1.ReferenceObject
  > = schema.components.securitySchemes

  // Use Set from the start for better memory efficiency
  const tokenUrls = new Set<string>()

  // Iterate through all security schemes
  for (const scheme of Object.values(securitySchemes)) {
    if (isReferenceObject(scheme) || !isOauth2SecurityScheme(scheme)) {
      continue
    }

    const flows = scheme.flows // Type assertion no longer needed

    // Helper to safely add valid token URLs
    const addTokenUrl = (url?: string) => {
      if (url && isValidTokenUrl(url)) {
        tokenUrls.add(getPathFromUrl(url))
      }
    }

    addTokenUrl(flows?.password?.tokenUrl)
    addTokenUrl(flows?.clientCredentials?.tokenUrl)
    addTokenUrl(flows?.authorizationCode?.tokenUrl)
  }

  return Array.from(tokenUrls)
}
