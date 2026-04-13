import type { ApiClientConfiguration } from '@scalar/types/api-reference'

/**
 * Resolve the default OAuth2 redirect URI.
 *
 * Priority:
 * 1. Explicit oauth2RedirectUri config override.
 * 2. Empty string in non-browser and file:// contexts.
 * 3. Browser origin + pathname fallback.
 */
export const resolveDefaultOAuth2RedirectUri = (config: Pick<ApiClientConfiguration, 'oauth2RedirectUri'>): string => {
  if (config.oauth2RedirectUri) {
    return config.oauth2RedirectUri
  }

  if (typeof window === 'undefined' || window.location.protocol === 'file:') {
    return ''
  }

  return window.location.origin + window.location.pathname
}
