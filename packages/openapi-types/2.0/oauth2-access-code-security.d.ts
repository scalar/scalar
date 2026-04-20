import type { Oauth2ScopesObject } from './oauth2-scopes'
/**
 * Security Scheme object
 *
 * Allows the definition of a security scheme that can be used by the operations. Supported schemes are basic authentication, an API key (either as a header or as a query parameter) and OAuth2's common flows (implicit, password, application and access code).
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#security-scheme-object}
 */
export type Oauth2AccessCodeSecurityObject = {
  /** **Required.** The type of the security scheme. Valid values are `"basic"`, `"apiKey"` or `"oauth2"`. */
  type: 'oauth2'
  /** **Required.** The flow used by the OAuth2 security scheme. Valid values are `"implicit"`, `"password"`, `"application"` or `"accessCode"`. */
  flow: 'accessCode'
  /** **Required.** The available scopes for the OAuth2 security scheme. */
  scopes: Oauth2ScopesObject
  /** **Required.** The authorization URL to be used for this flow. This SHOULD be in the form of a URL. */
  authorizationUrl: string
  /** **Required.** The token URL to be used for this flow. This SHOULD be in the form of a URL. */
  tokenUrl: string
  /** A short description for security scheme. */
  description?: string
}
