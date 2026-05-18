import {
  XScalarCredentialsLocation,
  XScalarSecretClientId,
  XScalarSecretClientSecret,
  XScalarSecretHTTP,
  XScalarSecretRedirectUri,
  XScalarSecretRefreshToken,
  XScalarSecretToken,
} from '@scalar/schemas/extensions/security'
import { openapiSchemas } from '@scalar/schemas/openapi/3.1'
import {
  type IntersectionMember,
  type Static,
  array,
  intersection,
  literal,
  number,
  object,
  optional,
  record,
  string,
  union,
} from '@scalar/validation'

const {
  authorizationCodeOAuth2Flow,
  clientCredentialsOAuth2Flow,
  implicitOAuth2Flow,
  passwordOAuth2Flow,
  securityRequirement,
} = openapiSchemas

const SecretsOAuthFlowCommon = intersection([XScalarSecretClientId, XScalarSecretToken, XScalarSecretRefreshToken])

const SecretsOAuthFlows = object({
  implicit: optional(intersection([SecretsOAuthFlowCommon, XScalarSecretRedirectUri])),
  password: optional(
    intersection([SecretsOAuthFlowCommon, XScalarSecretHTTP, XScalarSecretClientSecret, XScalarCredentialsLocation]),
  ),
  clientCredentials: optional(
    intersection([SecretsOAuthFlowCommon, XScalarSecretClientSecret, XScalarCredentialsLocation]),
  ),
  authorizationCode: optional(
    intersection([
      SecretsOAuthFlowCommon,
      XScalarSecretClientSecret,
      XScalarSecretRedirectUri,
      XScalarCredentialsLocation,
    ]),
  ),
})

const SecretsApiKey = intersection([object({ type: literal('apiKey') }), XScalarSecretToken])

export type SecretsApiKey = Static<typeof SecretsApiKey>

const SecretsHttp = intersection([object({ type: literal('http') }), XScalarSecretToken, XScalarSecretHTTP])

export type SecretsHttp = Static<typeof SecretsHttp>

export type SecretsOAuthFlows = Static<typeof SecretsOAuthFlows>

const SecretsOAuth = intersection([object({ type: literal('oauth2') }), SecretsOAuthFlows])

export type SecretsOAuth = Static<typeof SecretsOAuth>

/** OpenID Connect schema contain the base flows as well since it doesn't exist in the spec */
export const OpenIDConnectSchema = intersection([
  object({ type: literal('openIdConnect') }),
  object({
    implicit: optional(
      intersection([implicitOAuth2Flow as IntersectionMember, SecretsOAuthFlowCommon, XScalarSecretRedirectUri]),
    ),
    password: optional(
      intersection([
        passwordOAuth2Flow as IntersectionMember,
        SecretsOAuthFlowCommon,
        XScalarSecretHTTP,
        XScalarSecretClientSecret,
        XScalarCredentialsLocation,
      ]),
    ),
    clientCredentials: optional(
      intersection([
        clientCredentialsOAuth2Flow as IntersectionMember,
        SecretsOAuthFlowCommon,
        XScalarSecretClientSecret,
        XScalarCredentialsLocation,
      ]),
    ),
    authorizationCode: optional(
      intersection([
        authorizationCodeOAuth2Flow as IntersectionMember,
        SecretsOAuthFlowCommon,
        XScalarSecretClientSecret,
        XScalarSecretRedirectUri,
        XScalarCredentialsLocation,
      ]),
    ),
  }),
])

export type SecretsOpenIdConnect = Static<typeof OpenIDConnectSchema>

export const SecretsAuthUnionSchema = union([SecretsApiKey, SecretsHttp, SecretsOAuth, OpenIDConnectSchema])

export type SecretsAuthUnion = Static<typeof SecretsAuthUnionSchema>

export const SecretsAuthSchema = record(string(), SecretsAuthUnionSchema)

export type SecretsAuth = Static<typeof SecretsAuthSchema>

const SelectedSecuritySchema = object({
  selectedIndex: number(),
  selectedSchemes: array(securityRequirement),
})

export type SelectedSecurity = Static<typeof SelectedSecuritySchema>

export const AuthSchema = object({
  secrets: SecretsAuthSchema,
  selected: object({
    document: optional(SelectedSecuritySchema),
    path: optional(record(string(), record(string(), optional(SelectedSecuritySchema)))),
  }),
})

export type Auth = Static<typeof AuthSchema>

export const DocumentAuthSchema = record(string(), AuthSchema)

export type DocumentAuth = Static<typeof DocumentAuthSchema>
