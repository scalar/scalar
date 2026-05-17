import type {
  OAuthFlowAuthorizationCode,
  OAuthFlowClientCredentials,
  OAuthFlowImplicit,
  OAuthFlowPassword,
} from './oauth-flow'

export type OAuthFlowsObject = {
  /** Configuration for the OAuth Implicit flow */
  implicit?: OAuthFlowImplicit
  /** Configuration for the OAuth Resource Owner Password flow */
  password?: OAuthFlowPassword
  /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
  clientCredentials?: OAuthFlowClientCredentials
  /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
  authorizationCode?: OAuthFlowAuthorizationCode
}
