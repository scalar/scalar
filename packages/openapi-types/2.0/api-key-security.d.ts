/**
 * Security Scheme object
 *
 * Allows the definition of a security scheme that can be used by the operations. Supported schemes are basic authentication, an API key (either as a header or as a query parameter) and OAuth2's common flows (implicit, password, application and access code).
 *
 * @see {@link https://swagger.io/specification/v2/#security-scheme-object}
 */
export type ApiKeySecurityObject = {
  /** **Required.** The type of the security scheme. Valid values are `"basic"`, `"apiKey"` or `"oauth2"`. */
  type: 'apiKey'
  /** **Required.** The name of the header or query parameter to be used. */
  name: string
  /** **Required** The location of the API key. Valid values are `"query"` or `"header"`. */
  in: 'header' | 'query'
  /** A short description for security scheme. */
  description?: string
}
