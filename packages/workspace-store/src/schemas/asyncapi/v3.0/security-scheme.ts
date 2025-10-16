import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import {
  type XScalarSecretHTTP,
  XScalarSecretHTTPSchema,
  type XScalarSecretToken,
  XScalarSecretTokenSchema,
} from '@/schemas/extensions/security/x-scalar-security-secrets'

import type { OAuthFlowsObject } from './oauth-flows'
import { OAuthFlowsObjectSchemaDefinition } from './oauth-flows'

const DescriptionSchema = Type.Object({
  /** A short description for security scheme. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
})

type Description = {
  /** A short description for security scheme. CommonMark syntax MAY be used for rich text representation. */
  description?: string
}

// Simple security schemes with no additional required fields

export const UserPasswordSchema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('userPassword'),
  }),
)

export type UserPasswordObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'userPassword'
}

export const X509Schema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('X509'),
  }),
)

export type X509Object = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'X509'
}

export const SymmetricEncryptionSchema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('symmetricEncryption'),
  }),
)

export type SymmetricEncryptionObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'symmetricEncryption'
}

export const AsymmetricEncryptionSchema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('asymmetricEncryption'),
  }),
)

export type AsymmetricEncryptionObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'asymmetricEncryption'
}

export const PlainSchema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('plain'),
  }),
)

export type PlainObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'plain'
}

export const ScramSha256Schema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('scramSha256'),
  }),
)

export type ScramSha256Object = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'scramSha256'
}

export const ScramSha512Schema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('scramSha512'),
  }),
)

export type ScramSha512Object = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'scramSha512'
}

export const GssapiSchema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('gssapi'),
  }),
)

export type GssapiObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'gssapi'
}

// Security schemes with additional required fields

export const ApiKeySchema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('apiKey'),
    /** REQUIRED. The location of the API key. Valid values are "user" and "password". */
    in: Type.Union([Type.Literal('user'), Type.Literal('password')]),
  }),
)

export type ApiKeyObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'apiKey'
  /** REQUIRED. The location of the API key. Valid values are "user" and "password". */
  in: 'user' | 'password'
}

export const HttpApiKeySchema = compose(
  DescriptionSchema,
  XScalarSecretTokenSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('httpApiKey'),
    /** REQUIRED. The name of the header, query or cookie parameter to be used. */
    name: Type.String(),
    /** REQUIRED. The location of the API key. Valid values are "query", "header", or "cookie". */
    in: Type.Union([Type.Literal('query'), Type.Literal('header'), Type.Literal('cookie')]),
  }),
)

export type HttpApiKeyObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'httpApiKey'
  /** REQUIRED. The name of the header, query or cookie parameter to be used. */
  name: string
  /** REQUIRED. The location of the API key. Valid values are "query", "header", or "cookie". */
  in: 'query' | 'header' | 'cookie'
} & XScalarSecretToken

export const HttpSchema = compose(
  DescriptionSchema,
  XScalarSecretTokenSchema,
  XScalarSecretHTTPSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('http'),
    /** REQUIRED. The name of the HTTP Authorization scheme to be used in the Authorization header as defined in RFC7235. */
    scheme: Type.String(),
    /** A hint to the client to identify how the bearer token is formatted. Bearer tokens are usually generated by an authorization server, so this information is primarily for documentation purposes. */
    bearerFormat: Type.Optional(Type.String()),
  }),
)

export type HttpObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'http'
  /** REQUIRED. The name of the HTTP Authorization scheme to be used in the Authorization header as defined in RFC7235. */
  scheme: string
  /** A hint to the client to identify how the bearer token is formatted. Bearer tokens are usually generated by an authorization server, so this information is primarily for documentation purposes. */
  bearerFormat?: string
} & XScalarSecretHTTP &
  XScalarSecretToken

export const OAuth2Schema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('oauth2'),
    /** REQUIRED. An object containing configuration information for the flow types supported. */
    flows: OAuthFlowsObjectSchemaDefinition,
    /** List of the needed scope names. An empty array means no scopes are needed. */
    scopes: Type.Optional(Type.Array(Type.String())),
  }),
)

export type OAuth2Object = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'oauth2'
  /** REQUIRED. An object containing configuration information for the flow types supported. */
  flows: OAuthFlowsObject
  /** List of the needed scope names. An empty array means no scopes are needed. */
  scopes?: string[]
}

export const OpenIdConnectSchema = compose(
  DescriptionSchema,
  Type.Object({
    /** REQUIRED. The type of the security scheme. */
    type: Type.Literal('openIdConnect'),
    /** REQUIRED. OpenId Connect URL to discover OAuth2 configuration values. This MUST be in the form of an absolute URL. */
    openIdConnectUrl: Type.String(),
    /** List of the needed scope names. An empty array means no scopes are needed. */
    scopes: Type.Optional(Type.Array(Type.String())),
  }),
)

export type OpenIdConnectObject = Description & {
  /** REQUIRED. The type of the security scheme. */
  type: 'openIdConnect'
  /** REQUIRED. OpenId Connect URL to discover OAuth2 configuration values. This MUST be in the form of an absolute URL. */
  openIdConnectUrl: string
  /** List of the needed scope names. An empty array means no scopes are needed. */
  scopes?: string[]
}

/**
 * Defines a security scheme that can be used by the operations.
 *
 * Supported schemes are:
 * - User/Password
 * - API key (either as user or as password)
 * - X.509 certificate
 * - End-to-end encryption (either symmetric or asymmetric)
 * - HTTP authentication
 * - HTTP API key
 * - OAuth2's common flows (Implicit, Resource Owner Protected Credentials, Client Credentials and Authorization Code) as defined in RFC6749
 * - OpenID Connect Discovery
 * - SASL (Simple Authentication and Security Layer) as defined in RFC4422
 */
export const SecuritySchemeObjectSchemaDefinition = Type.Union([
  UserPasswordSchema,
  ApiKeySchema,
  X509Schema,
  SymmetricEncryptionSchema,
  AsymmetricEncryptionSchema,
  HttpApiKeySchema,
  HttpSchema,
  OAuth2Schema,
  OpenIdConnectSchema,
  PlainSchema,
  ScramSha256Schema,
  ScramSha512Schema,
  GssapiSchema,
])

export type SecuritySchemeObject =
  | UserPasswordObject
  | ApiKeyObject
  | X509Object
  | SymmetricEncryptionObject
  | AsymmetricEncryptionObject
  | HttpApiKeyObject
  | HttpObject
  | OAuth2Object
  | OpenIdConnectObject
  | PlainObject
  | ScramSha256Object
  | ScramSha512Object
  | GssapiObject
