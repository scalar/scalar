import type { OauthFlowsObject } from './oauth-flows'
/**
 * Security Scheme object
 *
 * Defines a security scheme that can be used by the operations.  Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter, or as a query parameter), OAuth2's common flows (implicit, password, client credentials, and authorization code) as defined in [RFC6749](https://tools.ietf.org/html/rfc6749), and [[OpenID-Connect-Core]]. Please note that as of 2020, the implicit flow is about to be deprecated by [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics). Recommended for most use cases is Authorization Code Grant flow with PKCE.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#security-scheme-object}
 */
export type Oauth2SecuritySchemeObject = {
  /** **REQUIRED**. The type of the security scheme. Valid values are `"apiKey"`, `"http"`, `"oauth2"`, `"openIdConnect"`. */
  type: 'oauth2'
  /** **REQUIRED**. An object containing configuration information for the flow types supported. */
  flows: OauthFlowsObject
  /** A description for security scheme. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
}
