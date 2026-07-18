import { type Static, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { XScalarCredentialsLocationSchema } from '@/schemas/extensions/security/x-scalar-credentials-location'
import {
  XScalarSecretClientCertificateSchema,
  XScalarSecretClientIdSchema,
  XScalarSecretClientSecretSchema,
  XScalarSecretHTTPSchema,
  XScalarSecretPrivateKeySchema,
  XScalarSecretRedirectUriSchema,
  XScalarSecretRefreshTokenSchema,
  XScalarSecretServiceNameSchema,
  XScalarSecretTokenSchema,
} from '@/schemas/extensions/security/x-scalar-security-secrets'
import {
  OAuthFlowAuthorizationCodeSchema,
  OAuthFlowClientCredentialsSchema,
  OAuthFlowImplicitSchema,
  OAuthFlowPasswordSchema,
} from '@/schemas/v3.1/strict/oauth-flow'
import { SecurityRequirementObjectSchema } from '@/schemas/v3.1/strict/openapi-document'

const SecretsApiKeySchema = compose(
  Type.Object({
    type: Type.Literal('apiKey'),
  }),
  XScalarSecretTokenSchema,
)

export type SecretsApiKey = Static<typeof SecretsApiKeySchema>

const SecretsHttpSchema = compose(
  Type.Object({
    type: Type.Literal('http'),
  }),
  XScalarSecretTokenSchema,
  XScalarSecretHTTPSchema,
)

export type SecretsHttp = Static<typeof SecretsHttpSchema>

const SecretsOAuthFlowCommonSchema = compose(
  XScalarSecretClientIdSchema,
  XScalarSecretTokenSchema,
  XScalarSecretRefreshTokenSchema,
)

const SecretsOAuthFlowsSchema = Type.Object({
  implicit: Type.Optional(compose(SecretsOAuthFlowCommonSchema, XScalarSecretRedirectUriSchema)),
  password: Type.Optional(
    compose(
      SecretsOAuthFlowCommonSchema,
      XScalarSecretHTTPSchema,
      XScalarSecretClientSecretSchema,
      XScalarCredentialsLocationSchema,
    ),
  ),
  clientCredentials: Type.Optional(
    compose(SecretsOAuthFlowCommonSchema, XScalarSecretClientSecretSchema, XScalarCredentialsLocationSchema),
  ),
  authorizationCode: Type.Optional(
    compose(
      SecretsOAuthFlowCommonSchema,
      XScalarSecretClientSecretSchema,
      XScalarSecretRedirectUriSchema,
      XScalarCredentialsLocationSchema,
    ),
  ),
})

export type SecretsOAuthFlows = Static<typeof SecretsOAuthFlowsSchema>

const OAuthSchema = compose(
  Type.Object({
    type: Type.Literal('oauth2'),
  }),
  SecretsOAuthFlowsSchema,
)

export type SecretsOAuth = Static<typeof OAuthSchema>

/** OpenID Connect schema contain the base flows as well since it doesn't exist in the spec */
export const OpenIDConnectSchema = Type.Object({
  type: Type.Literal('openIdConnect'),
  implicit: Type.Optional(
    compose(OAuthFlowImplicitSchema, SecretsOAuthFlowCommonSchema, XScalarSecretRedirectUriSchema),
  ),
  password: Type.Optional(
    compose(
      OAuthFlowPasswordSchema,
      SecretsOAuthFlowCommonSchema,
      XScalarSecretHTTPSchema,
      XScalarSecretClientSecretSchema,
      XScalarCredentialsLocationSchema,
    ),
  ),
  clientCredentials: Type.Optional(
    compose(
      OAuthFlowClientCredentialsSchema,
      SecretsOAuthFlowCommonSchema,
      XScalarSecretClientSecretSchema,
      XScalarCredentialsLocationSchema,
    ),
  ),
  authorizationCode: Type.Optional(
    compose(
      OAuthFlowAuthorizationCodeSchema,
      SecretsOAuthFlowCommonSchema,
      XScalarSecretClientSecretSchema,
      XScalarSecretRedirectUriSchema,
      XScalarCredentialsLocationSchema,
    ),
  ),
})

export type SecretsOpenIdConnect = Static<typeof OpenIDConnectSchema>

/**
 * AsyncAPI SASL-style broker schemes: all of them authenticate with a username + password pair,
 * so they share one secrets shape and are matched to the scheme by the stored `type`.
 */
const SecretsSaslSchema = compose(
  Type.Object({
    type: Type.Union([
      Type.Literal('userPassword'),
      Type.Literal('plain'),
      Type.Literal('scramSha256'),
      Type.Literal('scramSha512'),
    ]),
  }),
  XScalarSecretHTTPSchema,
)

export type SecretsSasl = Static<typeof SecretsSaslSchema>

/** AsyncAPI X509 broker scheme: a client certificate + private key pair (PEM). */
const SecretsX509Schema = compose(
  Type.Object({
    type: Type.Literal('X509'),
  }),
  XScalarSecretClientCertificateSchema,
  XScalarSecretPrivateKeySchema,
)

export type SecretsX509 = Static<typeof SecretsX509Schema>

/** AsyncAPI encryption broker schemes: a single key value, stored in the shared token slot. */
const SecretsEncryptionSchema = compose(
  Type.Object({
    type: Type.Union([Type.Literal('symmetricEncryption'), Type.Literal('asymmetricEncryption')]),
  }),
  XScalarSecretTokenSchema,
)

export type SecretsEncryption = Static<typeof SecretsEncryptionSchema>

/** AsyncAPI GSSAPI (Kerberos) broker scheme: the service name the client authenticates against. */
const SecretsGssapiSchema = compose(
  Type.Object({
    type: Type.Literal('gssapi'),
  }),
  XScalarSecretServiceNameSchema,
)

export type SecretsGssapi = Static<typeof SecretsGssapiSchema>

export const SecretsAuthUnionSchema = Type.Union([
  SecretsApiKeySchema,
  SecretsHttpSchema,
  OAuthSchema,
  OpenIDConnectSchema,
  SecretsSaslSchema,
  SecretsX509Schema,
  SecretsEncryptionSchema,
  SecretsGssapiSchema,
])
export type SecretsAuthUnion = Static<typeof SecretsAuthUnionSchema>

export const SecretsAuthSchema = Type.Record(Type.String(), SecretsAuthUnionSchema)
export type SecretsAuth = Static<typeof SecretsAuthSchema>

const SelectedSecuritySchema = Type.Object({
  selectedIndex: Type.Number(),
  selectedSchemes: Type.Array(SecurityRequirementObjectSchema),
})

export type SelectedSecurity = Static<typeof SelectedSecuritySchema>

export const AuthSchema = Type.Object({
  secrets: SecretsAuthSchema,
  selected: Type.Object({
    document: Type.Optional(SelectedSecuritySchema),
    path: Type.Optional(Type.Record(Type.String(), Type.Record(Type.String(), Type.Optional(SelectedSecuritySchema)))),
  }),
})

export type Auth = Static<typeof AuthSchema>

export const DocumentAuthSchema = Type.Record(Type.String(), AuthSchema)
export type DocumentAuth = Record<string, Auth>
