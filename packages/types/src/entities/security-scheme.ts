import {
  type Schema,
  any,
  array,
  boolean,
  coerce,
  evaluate,
  literal,
  number,
  object,
  optional,
  record,
  string,
  union,
} from '@scalar/validation'

import { type Brand, type ENTITY_BRANDS, nanoidSchema } from '../utils/nanoid'

/**
 * Branded uid shared by every security scheme entity.
 *
 * The exported types below are written explicitly instead of being derived from `Static<typeof schema>`.
 * `@scalar/validation`'s `Static` is a deeply nested conditional type; deriving these (fairly large) types
 * from it — and especially feeding the result to `PartialDeep` downstream (see the authentication
 * configuration) — exhausts TypeScript's instantiation budget and fails with `TS2589` "excessively deep".
 * Hand-writing the shapes keeps every consumer cheap while the runtime schemas below stay the single source
 * of truth for validation and coercion. This mirrors `@scalar/workspace-store`, which likewise pairs an
 * explicit `SecuritySchemeObject` union with its runtime schema.
 */
type SecuritySchemeUid = Brand<string, ENTITY_BRANDS['SECURITY_SCHEME']>

/** Properties shared by every security scheme. */
type CommonSecuritySchemeProps = {
  /** A description for security scheme. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** When true, the whole scheme is hidden from the auth UI. */
  'x-scalar-ignore'?: boolean
  /** UID for the entity, branded to the security scheme kind. */
  uid: SecuritySchemeUid
  /** The name key that links a security requirement to a security object. */
  nameKey: string
}

// ---------------------------------------------------------------------------
// Helpers
//
// `@scalar/validation` has no direct equivalent of a few zod combinators used here, so we recreate the
// exact runtime behaviour with `evaluate`, which normalises the incoming value before the inner schema
// validates or coerces it.

/**
 * Reproduces `z.enum(values).optional().default(fallback).catch(fallback)`.
 *
 * Any value that is not one of `values` (including `undefined`) becomes `fallback`.
 */
const enumWithDefault = <const Values extends readonly [string, ...string[]]>(
  values: Values,
  fallback: Values[number],
) =>
  evaluate(
    (value) => (typeof value === 'string' && (values as readonly string[]).includes(value) ? value : fallback),
    union(values.map((value) => literal(value)) as unknown as [Schema, ...Schema[]]),
  )

// ---------------------------------------------------------------------------
// COMMON PROPS FOR ALL SECURITY SCHEMES

/** Some common properties used in all security schemes */
const commonProps = {
  /** A description for security scheme. CommonMark syntax MAY be used for rich text representation. */
  description: optional(string()),
  /** When true, the whole scheme is hidden from the auth UI. See documentation/openapi.md. */
  'x-scalar-ignore': optional(boolean()),
}

const extendedSecurityProps = {
  uid: nanoidSchema,
  /** The name key that links a security requirement to a security object */
  nameKey: string({ default: '' }),
}

// ---------------------------------------------------------------------------
// API KEY

const securitySchemeApiKeyIn = ['query', 'header', 'cookie'] as const

const oasSecuritySchemeApiKeyProps = {
  ...commonProps,
  type: literal('apiKey'),
  /** REQUIRED. The name of the header, query or cookie parameter to be used. */
  name: string({ default: '' }),
  /** REQUIRED. The location of the API key. Valid values are "query", "header" or "cookie". */
  in: enumWithDefault(securitySchemeApiKeyIn, 'header'),
}

const oasSecuritySchemeApiKey = object(oasSecuritySchemeApiKeyProps)

const apiKeyValueProps = {
  value: string({ default: '' }),
}

export const securityApiKeySchema = object({
  ...oasSecuritySchemeApiKeyProps,
  ...extendedSecurityProps,
  ...apiKeyValueProps,
})
export type SecuritySchemeApiKey = CommonSecuritySchemeProps & {
  type: 'apiKey'
  /** REQUIRED. The name of the header, query or cookie parameter to be used. */
  name: string
  /** REQUIRED. The location of the API key. Valid values are "query", "header" or "cookie". */
  in: 'query' | 'header' | 'cookie'
  value: string
}

// ---------------------------------------------------------------------------
// HTTP

const oasSecuritySchemeHttpProps = {
  ...commonProps,
  type: literal('http'),
  /**
   * REQUIRED. The name of the HTTP Authorization scheme to be used in the Authorization header as defined in
   * [RFC7235]. The values used SHOULD be registered in the IANA Authentication Scheme registry.
   *
   * The value is lower-cased before validation to stay backwards-compatible with `z.string().toLowerCase()`.
   */
  scheme: evaluate(
    (value) => {
      const normalized = typeof value === 'string' ? value.toLowerCase() : value
      return normalized === 'basic' || normalized === 'bearer' ? normalized : 'basic'
    },
    union([literal('basic'), literal('bearer')]),
  ),
  /**
   * A hint to the client to identify how the bearer token is formatted.
   * Bearer tokens are usually generated by an authorization server, so
   * this information is primarily for documentation purposes.
   */
  bearerFormat: string({ default: 'JWT' }),
}

const oasSecuritySchemeHttp = object(oasSecuritySchemeHttpProps)

const httpValueProps = {
  username: string({ default: '' }),
  password: string({ default: '' }),
  token: string({ default: '' }),
}

export const securityHttpSchema = object({
  ...oasSecuritySchemeHttpProps,
  ...extendedSecurityProps,
  ...httpValueProps,
})
export type SecuritySchemaHttp = CommonSecuritySchemeProps & {
  type: 'http'
  /** REQUIRED. The name of the HTTP Authorization scheme to be used in the Authorization header. */
  scheme: 'basic' | 'bearer'
  /** A hint to the client to identify how the bearer token is formatted. */
  bearerFormat: string
  username: string
  password: string
  token: string
}

// ---------------------------------------------------------------------------
// OPENID CONNECT

const oasSecuritySchemeOpenIdProps = {
  ...commonProps,
  type: literal('openIdConnect'),
  /**
   * REQUIRED. OpenId Connect URL to discover OAuth2 configuration values. This MUST be in the
   * form of a URL. The OpenID Connect standard requires the use of TLS.
   */
  openIdConnectUrl: string({ default: '' }),
}

const oasSecuritySchemeOpenId = object(oasSecuritySchemeOpenIdProps)

export const securityOpenIdSchema = object({
  ...oasSecuritySchemeOpenIdProps,
  ...extendedSecurityProps,
})
export type SecuritySchemaOpenId = CommonSecuritySchemeProps & {
  type: 'openIdConnect'
  /** REQUIRED. OpenId Connect URL to discover OAuth2 configuration values. */
  openIdConnectUrl: string
}

// ---------------------------------------------------------------------------

/** Common properties used across all oauth2 flows */
const flowsCommon = {
  /**
   * The URL to be used for obtaining refresh tokens. This MUST be in the form of a
   * URL. The OAuth2 standard requires the use of TLS.
   */
  'refreshUrl': string({ default: '' }),
  /**
   * REQUIRED. The available scopes for the OAuth2 security scheme. A map
   * between the scope name and a short description for it. The map MAY be empty.
   */
  'scopes': record(string(), string()),
  'selectedScopes': array(string()),
  /** Extension to save the client Id associated with an oauth flow */
  'x-scalar-client-id': string({ default: '' }),
  /** The auth token */
  'token': string({ default: '' }),
  /** Additional query parameters for the OAuth authorization request. Example: { prompt: 'consent', audience: 'scalar' }. */
  'x-scalar-security-query': optional(record(string(), string())),
  /** Additional body parameters for the OAuth token request. Example: { audience: 'foo' }. */
  'x-scalar-security-body': optional(record(string(), string())),
  /** Extension to specify custom token name in the response (defaults to 'access_token') */
  'x-tokenName': optional(string()),
  /** Display order of this flow's tab in the auth UI (ascending). See documentation/openapi.md. */
  'x-order': optional(number()),
  /** When true, this flow's tab is hidden from the auth UI. See documentation/openapi.md. */
  'x-scalar-ignore': optional(boolean()),
}

/** Setup a default redirect uri if we can */
const defaultRedirectUri = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''

/** Options for the x-usePkce extension */
export const pkceOptions = ['SHA-256', 'plain', 'no'] as const

const credentialsLocationExtension = optional(union([literal('header'), literal('body')]))

const implicitFlowSchema = object({
  ...flowsCommon,
  'type': literal('implicit'),
  'authorizationUrl': string({ default: '' }),
  'x-scalar-redirect-uri': string({ default: defaultRedirectUri }),
})

const passwordFlowSchema = object({
  ...flowsCommon,
  'type': literal('password'),
  'tokenUrl': string({ default: '' }),
  'clientSecret': string({ default: '' }),
  'username': string({ default: '' }),
  'password': string({ default: '' }),
  'x-scalar-credentials-location': credentialsLocationExtension,
})

const clientCredentialsFlowSchema = object({
  ...flowsCommon,
  'type': literal('clientCredentials'),
  'tokenUrl': string({ default: '' }),
  'clientSecret': string({ default: '' }),
  'x-scalar-credentials-location': credentialsLocationExtension,
})

const authorizationCodeFlowSchema = object({
  ...flowsCommon,
  'type': literal('authorizationCode'),
  'authorizationUrl': string({ default: '' }),
  'x-usePkce': enumWithDefault(pkceOptions, 'no'),
  'x-scalar-redirect-uri': string({ default: defaultRedirectUri }),
  'tokenUrl': string({ default: '' }),
  'clientSecret': string({ default: '' }),
  'x-scalar-credentials-location': credentialsLocationExtension,
})

/** The default flows object applied when no `flows` are provided (mirrors the previous zod `.default(...)`). */
const defaultFlows = {
  implicit: {
    selectedScopes: [],
    scopes: {},
    'x-scalar-client-id': '',
    refreshUrl: '',
    token: '',
    type: 'implicit',
    authorizationUrl: 'http://localhost:8080',
    'x-scalar-redirect-uri': defaultRedirectUri,
  },
}

const oasSecuritySchemeOauth2Props = {
  ...commonProps,
  type: literal('oauth2'),
  /** The default scopes for the oauth flow */
  'x-default-scopes': optional(array(string())),
  /** REQUIRED. An object containing configuration information for the flow types supported. */
  flows: evaluate(
    (value) => (value === undefined ? defaultFlows : value),
    object({
      /** Configuration for the OAuth Implicit flow */
      implicit: optional(implicitFlowSchema),
      /** Configuration for the OAuth Resource Owner Password flow */
      password: optional(passwordFlowSchema),
      /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
      clientCredentials: optional(clientCredentialsFlowSchema),
      /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
      authorizationCode: optional(authorizationCodeFlowSchema),
    }),
  ),
}

const oasSecuritySchemeOauth2 = object(oasSecuritySchemeOauth2Props)

export const securityOauthSchema = object({
  ...oasSecuritySchemeOauth2Props,
  ...extendedSecurityProps,
})

/** Properties shared by every oauth2 flow. */
type OAuth2FlowCommon = {
  /** The URL to be used for obtaining refresh tokens. */
  refreshUrl: string
  /** REQUIRED. The available scopes for the OAuth2 security scheme. */
  scopes: Record<string, string>
  selectedScopes: string[]
  /** Extension to save the client Id associated with an oauth flow. */
  'x-scalar-client-id': string
  /** The auth token. */
  token: string
  /** Additional query parameters for the OAuth authorization request. */
  'x-scalar-security-query'?: Record<string, string>
  /** Additional body parameters for the OAuth token request. */
  'x-scalar-security-body'?: Record<string, string>
  /** Extension to specify custom token name in the response (defaults to 'access_token'). */
  'x-tokenName'?: string
  /** Display order of this flow's tab in the auth UI (ascending). */
  'x-order'?: number
  /** When true, this flow's tab is hidden from the auth UI. */
  'x-scalar-ignore'?: boolean
}

export type Oauth2FlowImplicit = OAuth2FlowCommon & {
  type: 'implicit'
  authorizationUrl: string
  'x-scalar-redirect-uri': string
}

export type Oauth2FlowPassword = OAuth2FlowCommon & {
  type: 'password'
  tokenUrl: string
  clientSecret: string
  username: string
  password: string
  'x-scalar-credentials-location'?: 'header' | 'body'
}

export type Oauth2FlowClientCredentials = OAuth2FlowCommon & {
  type: 'clientCredentials'
  tokenUrl: string
  clientSecret: string
  'x-scalar-credentials-location'?: 'header' | 'body'
}

export type Oauth2FlowAuthorizationCode = OAuth2FlowCommon & {
  type: 'authorizationCode'
  authorizationUrl: string
  'x-usePkce': (typeof pkceOptions)[number]
  'x-scalar-redirect-uri': string
  tokenUrl: string
  clientSecret: string
  'x-scalar-credentials-location'?: 'header' | 'body'
}

/** The set of oauth2 flows, each optional. */
export type Oauth2Flows = {
  implicit?: Oauth2FlowImplicit
  password?: Oauth2FlowPassword
  clientCredentials?: Oauth2FlowClientCredentials
  authorizationCode?: Oauth2FlowAuthorizationCode
}

export type SecuritySchemeOauth2 = CommonSecuritySchemeProps & {
  type: 'oauth2'
  /** The default scopes for the oauth flow. */
  'x-default-scopes'?: string[]
  /** REQUIRED. An object containing configuration information for the flow types supported. */
  flows: Oauth2Flows
}
export type SecuritySchemeOauth2Payload = SecuritySchemeOauth2
export type Oauth2Flow =
  | Oauth2FlowImplicit
  | Oauth2FlowPassword
  | Oauth2FlowClientCredentials
  | Oauth2FlowAuthorizationCode
/** Payload for the oauth 2 flows + extensions */
export type Oauth2FlowPayload = Oauth2Flow & Record<`x-${string}`, string>

// ---------------------------------------------------------------------------
// Final Types

/**
 * Security Requirement
 * Lists the required security schemes to execute this operation OR the whole collection/spec.
 * The name used for each property MUST correspond to a security scheme declared in the Security
 * Schemes under the Components Object.
 *
 * The key (name) here will be matched to the key of the securityScheme for linking
 *
 * @see https://spec.openapis.org/oas/latest.html#security-requirement-object
 */
export const oasSecurityRequirementSchema = record(string(), array(string()))

/** OAS Compliant security schemes */
export const oasSecuritySchemeSchema = union([
  oasSecuritySchemeApiKey,
  oasSecuritySchemeHttp,
  oasSecuritySchemeOauth2,
  oasSecuritySchemeOpenId,
])

const securitySchemeUnion = union([securityApiKeySchema, securityHttpSchema, securityOpenIdSchema, securityOauthSchema])

/**
 * Applies the `x-default-scopes` extension to every oauth2 flow's `selectedScopes`.
 *
 * This preserves the behaviour of the previous zod `.transform(...)`: after the union coerces the value into
 * its final shape, we copy `x-default-scopes` into each flow's `selectedScopes`.
 */
const applyDefaultScopes = (data: SecurityScheme): SecurityScheme => {
  if (data.type === 'oauth2' && data['x-default-scopes']?.length) {
    const keys = Object.keys(data.flows) as Array<keyof typeof data.flows>
    keys.forEach((key) => {
      const flow = data.flows[key]
      if (flow?.selectedScopes && data['x-default-scopes']) {
        flow.selectedScopes = [data['x-default-scopes']].flat()
      }
    })
  }
  return data
}

/**
 * Extended security schemes for workspace usage.
 *
 * Coercing a value with this schema runs the union coercion first and then applies the `x-default-scopes`
 * transform, mirroring the previous zod `discriminatedUnion(...).transform(...)`. The inner schema is
 * `any()` so the transformed value passes through untouched; the type is pinned to the union so `Static`
 * and downstream `import type` sites keep the exact discriminated-union shape.
 */
// `coerce`'s return type is `Static<S>`; on the full concrete union that computation is deep enough to trip
// `tsc`'s `TS2589` budget when instantiated here. Reference it through a plain `(schema, value) => unknown`
// signature so the return type is not computed at this call site; the runtime behaviour is unchanged.
const coerceValue = coerce as (schema: Schema, value: unknown) => unknown

export const securitySchemeSchema = evaluate(
  (value) => applyDefaultScopes(coerceValue(securitySchemeUnion, value) as SecurityScheme),
  any(),
) as unknown as typeof securitySchemeUnion

/**
 * Security Scheme Object
 *
 * Built from the already-materialised branch types instead of `Static<typeof securitySchemeUnion>`.
 * Resolving the union once here keeps the type shallow so downstream `PartialDeep<SecurityScheme>` usages
 * (for example the authentication configuration) do not hit `TS2589` "excessively deep" instantiation.
 *
 * @see https://spec.openapis.org/oas/latest.html#security-scheme-object
 */
export type SecurityScheme = SecuritySchemeApiKey | SecuritySchemaHttp | SecuritySchemaOpenId | SecuritySchemeOauth2
export type SecuritySchemePayload = SecurityScheme
