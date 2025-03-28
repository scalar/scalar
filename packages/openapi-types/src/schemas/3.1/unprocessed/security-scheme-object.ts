import {
  ApiKeyInValues as OriginalApiKeyInValues,
  ApiKeySchema as OriginalApiKeySchema,
  HttpSchema as OriginalHttpSchema,
  MutualTlsSchema as OriginalMutualTlsSchema,
  OAuth2FlowObjectSchema as OriginalOAuth2FlowObjectSchema,
  OAuthFlowObjectSchema as OriginalOAuthFlowObjectSchema,
  OpenIdConnectSchema as OriginalOpenIdConnectSchema,
  SecuritySchemeObjectSchema as OriginalSecuritySchemeObjectSchema,
  XUsePkceValues as OriginalXUsePkceValues,
} from '../processed/security-scheme-object'

/**
 * Security Scheme Object
 *
 * Defines a security scheme that can be used by the operations.
 *
 * Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter or as a query
 * parameter), mutual TLS (use of a client certificate), OAuth2's common flows (implicit, password, client credentials
 * and authorization code) as defined in RFC6749, and [[OpenID-Connect-Core]]. Please note that as of 2020, the implicit
 * flow is about to be deprecated by OAuth 2.0 Security Best Current Practice. Recommended for most use cases is
 * Authorization Code Grant flow with PKCE.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#security-scheme-object
 */
export const SecuritySchemeObjectSchema = OriginalSecuritySchemeObjectSchema
export const ApiKeyInValues = OriginalApiKeyInValues
export const ApiKeySchema = OriginalApiKeySchema
export const HttpSchema = OriginalHttpSchema
export const OpenIdConnectSchema = OriginalOpenIdConnectSchema
export const OAuthFlowObjectSchema = OriginalOAuthFlowObjectSchema
export const XUsePkceValues = OriginalXUsePkceValues
export const OAuth2FlowObjectSchema = OriginalOAuth2FlowObjectSchema
export const MutualTlsSchema = OriginalMutualTlsSchema
