import { intersection, object, optional, record, string } from '@scalar/validation'

import {
  XScalarAuthUrl,
  XScalarCredentialsLocation,
  XScalarSecurityBody,
  XScalarSecurityQuery,
  XScalarTokenUrl,
  XTokenName,
  XusePkce,
} from '@/extensions/security'

const oauthFlowExtensionObjects = [
  XScalarSecurityQuery,
  XScalarSecurityBody,
  XTokenName,
  XScalarAuthUrl,
  XScalarTokenUrl,
] as const

const oauthFlowCore = object(
  {
    refreshUrl: string({
      typeComment:
        'The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
    }),
    scopes: record(string(), string(), {
      typeComment:
        'REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty.',
      typeName: 'OAuthFlowScopes',
    }),
  },
  { typeName: 'OAuthFlowBaseCore' },
)

export const openApiImplicitOAuth2FlowObject = intersection(
  [
    oauthFlowCore,
    ...oauthFlowExtensionObjects,
    object({
      authorizationUrl: string({
        typeComment:
          'REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
      }),
    }),
  ],
  { typeName: 'ImplicitOAuthFlowObject' },
)

export const openApiPasswordOAuth2FlowObject = intersection(
  [
    oauthFlowCore,
    ...oauthFlowExtensionObjects,
    object({
      tokenUrl: string({
        typeComment:
          'REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
      }),
    }),
    XScalarCredentialsLocation,
  ],
  { typeName: 'PasswordOAuthFlowObject' },
)

export const openApiClientCredentialsOAuth2FlowObject = intersection(
  [
    oauthFlowCore,
    ...oauthFlowExtensionObjects,
    object({
      tokenUrl: string({
        typeComment:
          'REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
      }),
    }),
    XScalarCredentialsLocation,
  ],
  { typeName: 'ClientCredentialsOAuthFlowObject' },
)

export const openApiAuthorizationCodeOAuth2FlowObject = intersection(
  [
    oauthFlowCore,
    ...oauthFlowExtensionObjects,
    object({
      authorizationUrl: string({
        typeComment:
          'REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
      }),
      tokenUrl: string({
        typeComment:
          'REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS.',
      }),
    }),
    XusePkce,
    XScalarCredentialsLocation,
  ],
  { typeName: 'AuthorizationCodeOAuthFlowObject' },
)

export const openApiOAuthFlowsObject = object(
  {
    implicit: optional(openApiImplicitOAuth2FlowObject),
    password: optional(openApiPasswordOAuth2FlowObject),
    clientCredentials: optional(openApiClientCredentialsOAuth2FlowObject),
    authorizationCode: optional(openApiAuthorizationCodeOAuth2FlowObject),
  },
  { typeName: 'OAuthFlowsObject' },
)
