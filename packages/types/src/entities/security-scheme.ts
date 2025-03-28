import { z } from 'zod'

import { type ENTITY_BRANDS, nanoidSchema } from '@/utils/nanoid.ts'
import {
  OAuth2FlowObjectSchema,
  ApiKeySchema as OriginalApiKeySchema,
  HttpSchema as OriginalHttpSchema,
  MutualTlsSchema as OriginalMutualTlsSchema,
  OpenIdConnectSchema as OriginalOpenIdConnectSchema,
} from '@scalar/openapi-types/schemas/3.1/processed'

// TODO: Add
// 'selectedScopes': z.array(z.string()).optional().default([]),

// Extend all security scheme schemas with a uid and nameKey
const SecuritySchemeSchemaExtension = z.object({
  uid: nanoidSchema.brand<ENTITY_BRANDS['SECURITY_SCHEME']>(),
  /** The name key that links a security requirement to a security object */
  nameKey: z.string().optional().default(''),
})

// API Key
export const ApiKeySchema = OriginalApiKeySchema.merge(SecuritySchemeSchemaExtension).extend({
  value: z.string().default(''),
})
export type SecuritySchemeApiKey = z.infer<typeof ApiKeySchema>

// HTTP
export const HttpSchema = OriginalHttpSchema.merge(SecuritySchemeSchemaExtension).extend({
  username: z.string().default(''),
  password: z.string().default(''),
  token: z.string().default(''),
})
export type SecuritySchemaHttp = z.infer<typeof HttpSchema>

// OpenID Connect
export const OpenIdConnectSchema = OriginalOpenIdConnectSchema.merge(SecuritySchemeSchemaExtension)
export type SecuritySchemaOpenId = z.infer<typeof OpenIdConnectSchema>

// Mutual TLS
export const MutualTlsSchema = OriginalMutualTlsSchema.merge(SecuritySchemeSchemaExtension)
export type SecuritySchemaMutualTls = z.infer<typeof MutualTlsSchema>

// OAuth2
export const securityOauthSchema = OAuth2FlowObjectSchema.merge(SecuritySchemeSchemaExtension)

export type SecuritySchemeOauth2 = z.infer<typeof securityOauthSchema>
export type SecuritySchemeOauth2Payload = z.input<typeof securityOauthSchema>
export type Oauth2Flow = NonNullable<
  SecuritySchemeOauth2['flows']['authorizationCode' | 'clientCredentials' | 'implicit' | 'password']
>
/** Payload for the oauth 2 flows + extensions */
export type Oauth2FlowPayload = NonNullable<SecuritySchemeOauth2Payload['flows']>[
  | 'authorizationCode'
  | 'clientCredentials'
  | 'implicit'
  | 'password'] &
  Record<`x-${string}`, string>

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
export const SecuritySchemeObjectSchema = z.union([
  ApiKeySchema,
  HttpSchema,
  MutualTlsSchema,
  OAuth2FlowObjectSchema,
  OpenIdConnectSchema,
])

export type SecurityScheme = z.infer<typeof SecuritySchemeObjectSchema>
export type SecuritySchemePayload = z.input<typeof SecuritySchemeObjectSchema>
