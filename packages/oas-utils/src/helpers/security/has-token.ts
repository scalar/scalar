import type { SecurityScheme } from '@scalar/types/entities'

/** Pass in a security scheme and it will return true if it has a token or value depending on the scheme type */
export const hasToken = (scheme: SecurityScheme): Boolean => {
  // ApiKey
  if (scheme.type === 'apiKey') {
    return Boolean(scheme.value)
  }

  // Http
  if (scheme.type === 'http') {
    return Boolean(
      (scheme.scheme === 'bearer' && scheme.token) || (scheme.scheme === 'basic' && scheme.username && scheme.password),
    )
  }

  // OAuth2 just check for A token
  if (scheme.type === 'oauth2') {
    return Boolean(
      scheme.flows.authorizationCode?.token ||
        scheme.flows.clientCredentials?.token ||
        scheme.flows.password?.token ||
        scheme.flows.implicit?.token,
    )
  }

  return false
}
