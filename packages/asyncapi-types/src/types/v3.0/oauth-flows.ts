import type {
  OAuthFlowAuthorizationCodeObject,
  OAuthFlowClientCredentialsObject,
  OAuthFlowImplicitObject,
  OAuthFlowPasswordObject,
} from './oauth-flow'

export type OAuthFlowsObject = {
  /** Configuration for the OAuth Implicit flow */
  implicit?: OAuthFlowImplicitObject
  /** Configuration for the OAuth Resource Owner Protected Credentials flow */
  password?: OAuthFlowPasswordObject
  /** Configuration for the OAuth Client Credentials flow */
  clientCredentials?: OAuthFlowClientCredentialsObject
  /** Configuration for the OAuth Authorization Code flow */
  authorizationCode?: OAuthFlowAuthorizationCodeObject
}
