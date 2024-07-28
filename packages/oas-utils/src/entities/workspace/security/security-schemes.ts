import { deepMerge } from '@/helpers'
import { z } from 'zod'

import { nanoidSchema } from '../shared'

/** A generic string value used for filling in fields  */
const value = z.string().optional().default('')

/** Some common properties used in all security schemes */
const commonProps = z.object({
  uid: nanoidSchema,
  /** The name key that links a security requirement to a security object */
  nameKey: z.string().optional().default(''),
  /* A description for security scheme. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
})

export const securitySchemeApiKeyIn = ['query', 'header', 'cookie'] as const

const securitySchemeApiKey = commonProps.extend({
  type: z.literal('apiKey'),
  /** REQUIRED. The name of the header, query or cookie parameter to be used. */
  name: z.string().optional().default(''),
  /** REQUIRED. The location of the API key. Valid values are "query", "header" or "cookie". */
  in: z.enum(securitySchemeApiKeyIn).optional().default('header'),
  value,
})

export type SecuritySchemeApiKey = z.infer<typeof securitySchemeApiKey>

const securitySchemeHttp = commonProps.extend({
  type: z.literal('http'),
  /**
   * REQUIRED. The name of the HTTP Authorization scheme to be used in the Authorization header as defined in
   * [RFC7235]. The values used SHOULD be registered in the IANA Authentication Scheme registry.
   */
  scheme: z.enum(['basic', 'bearer']).optional().default('basic'),
  /**
   * A hint to the client to identify how the bearer token is formatted.
   * Bearer tokens are usually generated by an authorization server, so
   * this information is primarily for documentation purposes.
   */
  bearerFormat: z
    .union([z.literal('JWT'), z.string()])
    .optional()
    .default('JWT'),
  /** Username */
  value,
  /** Password */
  secondValue: value,
})

/**
 * REQUIRED. The authorization URL to be used for this flow. This MUST be in
 * the form of a URL. The OAuth2 standard requires the use of TLS.
 */
const authorizationUrl = z.string().optional().default('https://scalar.com')

/**
 * REQUIRED. The token URL to be used for this flow. This MUST be in the
 * form of a URL. The OAuth2 standard requires the use of TLS.
 */
const tokenUrl = z.string().optional().default('https://scalar.com')

/** Common properties used across all oauth2 flows */
const oauthCommon = z.object({
  /**
   * The URL to be used for obtaining refresh tokens. This MUST be in the form of a
   * URL. The OAuth2 standard requires the use of TLS.
   */
  refreshUrl: z.string().optional().default(''),
  /**
   * REQUIRED. The available scopes for the OAuth2 security scheme. A map
   * between the scope name and a short description for it. The map MAY be empty.
   */
  scopes: z
    .union([
      z.map(z.string(), z.string().optional()),
      z.record(z.string(), z.string().optional()),
      z.object({}),
    ])
    .optional(),
  /** User selected scopes per flow */
  selectedScopes: z.array(z.string()).optional().default([]),
  token: value,
})

const oauthFlowSchema = z
  .discriminatedUnion('type', [
    /** Configuration for the OAuth Implicit flow */
    oauthCommon.extend({
      type: z.literal('implicit'),
      authorizationUrl,
    }),
    /** Configuration for the OAuth Resource Owner Password flow */
    oauthCommon.extend({
      type: z.literal('password'),
      tokenUrl,
      /** Username */
      value,
      /** Password */
      secondValue: value,
      clientSecret: value,
    }),
    /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
    oauthCommon.extend({
      type: z.literal('clientCredentials'),
      tokenUrl,
      clientSecret: value,
    }),
    /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0.*/
    oauthCommon.extend({
      type: z.literal('authorizationCode'),
      authorizationUrl,
      tokenUrl,
      clientSecret: value,
    }),
  ])
  .optional()
  .default({ type: 'implicit' })

const securitySchemeOauth2 = commonProps.extend({
  type: z.literal('oauth2'),
  /** REQUIRED. An object containing configuration information for the flow types supported. */
  flow: oauthFlowSchema,
  clientId: value,
  redirectUri: z.string().optional().default(''),
})
export type SecuritySchemeOauth2 = z.infer<typeof securitySchemeOauth2>

const securitySchemeOpenId = commonProps.extend({
  type: z.literal('openIdConnect'),
  /**
   * REQUIRED. OpenId Connect URL to discover OAuth2 configuration values. This MUST be in the
   * form of a URL. The OpenID Connect standard requires the use of TLS.
   */
  openIdConnectUrl: z.string().optional().default(''),
})

const securityScheme = z.union([
  securitySchemeApiKey,
  securitySchemeHttp,
  securitySchemeOauth2,
  securitySchemeOpenId,
])

/**
 * Security Scheme Object
 *
 * @see https://spec.openapis.org/oas/latest.html#security-scheme-object
 */
export type SecurityScheme = z.infer<typeof securityScheme>
export type SecuritySchemePayload = z.input<typeof securityScheme>

/** Create Security Scheme with defaults */
export const createSecurityScheme = (payload: SecuritySchemePayload) =>
  deepMerge(securityScheme.parse({ type: payload.type }), payload)
