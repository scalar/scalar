import { type Static, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { XScalarCredentialsLocationSchema } from '@/schemas/extensions/security/x-scalar-credentials-location'
import {
  XScalarSecretClientIdSchema,
  XScalarSecretClientSecretSchema,
  XScalarSecretHTTPSchema,
  XScalarSecretRedirectUriSchema,
  XScalarSecretTokenSchema,
} from '@/schemas/extensions/security/x-scalar-security-secrets'
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

const SecretsOAuthFlowCommonSchema = compose(XScalarSecretClientIdSchema, XScalarSecretTokenSchema)

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

export const SecretsAuthUnionSchema = Type.Union([SecretsApiKeySchema, SecretsHttpSchema, OAuthSchema])
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
    path: Type.Optional(Type.Record(Type.String(), Type.Record(Type.String(), SelectedSecuritySchema))),
  }),
})

export type Auth = Static<typeof AuthSchema>

export const DocumentAuthSchema = Type.Record(Type.String(), AuthSchema)
export type DocumentAuth = Record<string, Auth>
