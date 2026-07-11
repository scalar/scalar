import type {
  XScalarAuthUrl,
  XScalarCredentialsLocation,
  XScalarSecretClientCertificate,
  XScalarSecretClientId,
  XScalarSecretClientSecret,
  XScalarSecretHTTP,
  XScalarSecretPrivateKey,
  XScalarSecretRedirectUri,
  XScalarSecretRefreshToken,
  XScalarSecretServiceName,
  XScalarSecretToken,
  XScalarTokenUrl,
} from '@/schemas/extensions/security'
import type {
  OAuthFlowAuthorizationCode,
  OAuthFlowClientCredentials,
  OAuthFlowImplicit,
  OAuthFlowPassword,
} from '@/schemas/v3.1/strict/oauth-flow'
import type { ApiKeyObject, HttpObject, OAuth2Object, OpenIdConnectObject } from '@/schemas/v3.1/strict/security-scheme'

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

/**
 * Base shape for AsyncAPI broker-only security schemes. These types live outside the strict
 * OpenAPI `SecuritySchemeObject` union (they are AsyncAPI-only), so only the shared fields are modeled.
 */
type AsyncApiBrokerScheme<T extends string> = {
  type: T
  description?: string
}

/** SASL-style AsyncAPI broker schemes: authenticate with a username + password pair. */
export type SaslObjectSecret = AsyncApiBrokerScheme<'userPassword' | 'plain' | 'scramSha256' | 'scramSha512'> &
  XScalarSecretHTTP

/** AsyncAPI X509 scheme: a client certificate + private key pair (PEM). */
export type X509ObjectSecret = AsyncApiBrokerScheme<'X509'> & XScalarSecretClientCertificate & XScalarSecretPrivateKey

/** AsyncAPI encryption schemes: a single key value, stored in the shared token slot. */
export type EncryptionObjectSecret = AsyncApiBrokerScheme<'symmetricEncryption' | 'asymmetricEncryption'> &
  XScalarSecretToken

/** AsyncAPI GSSAPI (Kerberos) scheme: the service name the client authenticates against. */
export type GssapiObjectSecret = AsyncApiBrokerScheme<'gssapi'> & XScalarSecretServiceName

export type SecuritySchemeObjectSecret =
  | ApiKeyObjectSecret
  | HttpObjectSecret
  | OpenIdConnectObjectSecret
  | OAuth2ObjectSecret
  | SaslObjectSecret
  | X509ObjectSecret
  | EncryptionObjectSecret
  | GssapiObjectSecret
