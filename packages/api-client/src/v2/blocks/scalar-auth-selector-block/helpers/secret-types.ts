import type {
  XScalarAuthUrl,
  XScalarCredentialsLocation,
  XScalarSecretClientId,
  XScalarSecretClientSecret,
  XScalarSecretHTTP,
  XScalarSecretRedirectUri,
  XScalarSecretRefreshToken,
  XScalarSecretToken,
  XScalarTokenUrl,
} from '@scalar/workspace-store/schemas/extensions/security'
import type {
  OAuthFlowAuthorizationCode,
  OAuthFlowClientCredentials,
  OAuthFlowImplicit,
  OAuthFlowPassword,
} from '@scalar/workspace-store/schemas/v3.1/strict/oauth-flow'
import type {
  ApiKeyObject,
  HttpObject,
  OAuth2Object,
  OpenIdConnectObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

type OAuthFlowCommonSecret = XScalarSecretClientId &
  XScalarSecretToken &
  XScalarSecretRefreshToken &
  XScalarAuthUrl &
  XScalarTokenUrl

export type OAuthFlowImplicitSecret = OAuthFlowImplicit & OAuthFlowCommonSecret & XScalarSecretRedirectUri

export type OAuthFlowPasswordSecret = OAuthFlowPassword &
  OAuthFlowCommonSecret &
  XScalarSecretHTTP &
  XScalarSecretClientSecret &
  XScalarCredentialsLocation

export type OAuthFlowClientCredentialsSecret = OAuthFlowClientCredentials &
  OAuthFlowCommonSecret &
  XScalarSecretClientSecret &
  XScalarCredentialsLocation

export type OAuthFlowAuthorizationCodeSecret = OAuthFlowAuthorizationCode &
  OAuthFlowCommonSecret &
  XScalarSecretClientSecret &
  XScalarSecretRedirectUri &
  XScalarCredentialsLocation

export type OAuthFlowsObjectSecret = {
  implicit?: OAuthFlowImplicitSecret
  password?: OAuthFlowPasswordSecret
  clientCredentials?: OAuthFlowClientCredentialsSecret
  authorizationCode?: OAuthFlowAuthorizationCodeSecret
}

export type ApiKeyObjectSecret = ApiKeyObject & XScalarSecretToken
export type HttpObjectSecret = HttpObject & XScalarSecretHTTP & XScalarSecretToken
export type OAuth2ObjectSecret = Omit<OAuth2Object, 'flows'> & { flows: OAuthFlowsObjectSecret }
export type OpenIdConnectObjectSecret = OpenIdConnectObject & { flows?: OAuthFlowsObjectSecret }

export type SecuritySchemeObjectSecret =
  | ApiKeyObjectSecret
  | HttpObjectSecret
  | OAuth2ObjectSecret
  | OpenIdConnectObjectSecret
