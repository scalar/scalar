import type { TypeApikeyObject } from './type-apikey'
import type { TypeHttpBearerObject } from './type-http-bearer'
import type { TypeHttpObject } from './type-http'
import type { TypeOauth2Object } from './type-oauth2'
import type { TypeOidcObject } from './type-oidc'
/**
 * Security Scheme object
 *
 * Defines a security scheme that can be used by the operations.  Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter or as a query parameter), mutual TLS (use of a client certificate), OAuth2's common flows (implicit, password, client credentials and authorization code) as defined in [RFC6749](https://tools.ietf.org/html/rfc6749), and [[OpenID-Connect-Core]]. Please note that as of 2020, the implicit flow is about to be deprecated by [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics). Recommended for most use cases is Authorization Code Grant flow with PKCE.
 *
 * @see {@link https://spec.openapis.org/oas/v3.1#security-scheme-object}
 */
export type SecuritySchemeObject =
  | TypeApikeyObject
  | TypeHttpObject
  | TypeHttpBearerObject
  | TypeOauth2Object
  | TypeOidcObject
