import { z } from 'zod'

import { type ENTITY_BRANDS, nanoidSchema } from '@/utils/nanoid.ts'
import {
  ApiKeySchema as OriginalApiKeySchema,
  AuthorizationCodeFlowSchema as OriginalAuthorizationCodeFlowSchema,
  ClientCredentialsFlowSchema as OriginalClientCredentialsFlowSchema,
  HttpSchema as OriginalHttpSchema,
  ImplicitFlowSchema as OriginalImplicitFlowSchema,
  MutualTlsSchema as OriginalMutualTlsSchema,
  OAuthFlowsObjectSchema as OriginalOAuthFlowsObjectSchema,
  OpenIdConnectSchema as OriginalOpenIdConnectSchema,
  PasswordFlowSchema as OriginalPasswordFlowSchema,
  SecurityRequirementObjectSchema,
} from '@scalar/openapi-types/schemas/3.1/processed'
import { XUsePkceValues, XusePkceSchema } from '@scalar/openapi-types/schemas/extensions'

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
// TODO: This fallback should be in the code, not in the schema/store. URLs can change when syncing with team members for example.
/** Setup a default redirect uri if we can */
const defaultRedirectUri = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''

const OAuthValuesSchema = z.object({
  'selectedScopes': z.array(z.string()).optional().default([]),
  /** Extension to save the client Id associated with an oauth flow */
  'x-scalar-client-id': z.string().optional(),
  clientSecret: z.string().default(''),
  /** The auth token */
  'token': z.string(),
})

const ImplicitFlowSchema = OriginalImplicitFlowSchema.merge(OAuthValuesSchema).extend({
  'x-scalar-redirect-uri': z.string().optional().default(defaultRedirectUri),
})

const PasswordFlowSchema = OriginalPasswordFlowSchema.merge(OAuthValuesSchema).extend({
  username: z.string().default(''),
  password: z.string().default(''),
})

const ClientCredentialsFlowSchema = OriginalClientCredentialsFlowSchema.merge(OAuthValuesSchema)

const AuthorizationCodeFlowSchema = OriginalAuthorizationCodeFlowSchema.merge(OAuthValuesSchema)
  .merge(XusePkceSchema)
  .extend({
    'x-scalar-redirect-uri': z.string().optional().default(defaultRedirectUri),
  })
/**
 * OAuth Flows Object
 *
 * Allows configuration of the supported OAuth Flows.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#oauth-flows-object
 */
export const OAuthFlowsObjectSchema = OriginalOAuthFlowsObjectSchema.extend({
  /**
   * REQUIRED. An object containing configuration information for the flow types supported.
   */
  flows: z
    .object({
      /**
       * Configuration for the OAuth Implicit flow
       */
      implicit: ImplicitFlowSchema.optional(),
      /**
       * Configuration for the OAuth Resource Owner Password flow
       */
      password: PasswordFlowSchema.optional(),
      /**
       * Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0.
       */
      clientCredentials: ClientCredentialsFlowSchema.optional(),
      /**
       * Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0.
       */
      authorizationCode: AuthorizationCodeFlowSchema.optional(),
    })
    .partial()
    .default({
      implicit: { type: 'implicit', authorizationUrl: 'http://localhost:8080', token: '' },
    }),
})

export const OAuthFlowsObject = OriginalOAuthFlowsObjectSchema.extend({
  /**
   * REQUIRED. An object containing configuration information for the flow types supported.
   */
  flows: z
    .object({
      /**
       * Configuration for the OAuth Implicit flow
       */
      implicit: ImplicitFlowSchema.optional(),
      /**
       * Configuration for the OAuth Resource Owner Password flow
       */
      password: PasswordFlowSchema.optional(),
      /**
       * Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0.
       */
      clientCredentials: ClientCredentialsFlowSchema.optional(),
      /**
       * Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0.
       */
      authorizationCode: AuthorizationCodeFlowSchema.optional(),
    })
    .partial()
    .default({
      implicit: { type: 'implicit', authorizationUrl: 'http://localhost:8080', token: '' },
    }),
}).merge(SecuritySchemeSchemaExtension)

export type SecuritySchemeOauth2 = z.infer<typeof OAuthFlowsObject>
export type SecuritySchemeOauth2Payload = z.input<typeof OAuthFlowsObject>
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
  OAuthFlowsObjectSchema,
  OpenIdConnectSchema,
])

export type SecurityScheme = z.infer<typeof SecuritySchemeObjectSchema>
export type SecuritySchemePayload = z.input<typeof SecuritySchemeObjectSchema>

export { XUsePkceValues, SecurityRequirementObjectSchema }
