import type { ApiKeySecuritySchemeObject } from './api-key-security-scheme'
import type { HttpSecuritySchemeObject } from './http-security-scheme'
import type { Oauth2SecuritySchemeObject } from './oauth2-security-scheme'
import type { OpenIdConnectSecuritySchemeObject } from './open-id-connect-security-scheme'
/**
 * Security Scheme object
 *
 * Defines a security scheme that can be used by the operations.  Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter, or as a query parameter), OAuth2's common flows (implicit, password, client credentials, and authorization code) as defined in [RFC6749](https://tools.ietf.org/html/rfc6749), and [[OpenID-Connect-Core]]. Please note that as of 2020, the implicit flow is about to be deprecated by [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics). Recommended for most use cases is Authorization Code Grant flow with PKCE.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#security-scheme-object}
 */
export type SecuritySchemeObject =
  | ApiKeySecuritySchemeObject
  | HttpSecuritySchemeObject
  | Oauth2SecuritySchemeObject
  | OpenIdConnectSecuritySchemeObject
