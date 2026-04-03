import type { AuthorizationCodeOauthFlowObject } from './authorization-code-oauth-flow'
import type { ClientCredentialsFlowObject } from './client-credentials-flow'
import type { ImplicitOauthFlowObject } from './implicit-oauth-flow'
import type { PasswordOauthFlowObject } from './password-oauth-flow'
/**
 * Oauth Flows object
 *
 * Allows configuration of the supported OAuth Flows.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#oauth-flows-object}
 */
export type OauthFlowsObject = {
  /** Configuration for the OAuth Implicit flow */
  implicit?: ImplicitOauthFlowObject
  /** Configuration for the OAuth Resource Owner Password flow */
  password?: PasswordOauthFlowObject
  /** Configuration for the OAuth Client Credentials flow. Previously called `application` in OpenAPI 2.0. */
  clientCredentials?: ClientCredentialsFlowObject
  /** Configuration for the OAuth Authorization Code flow. Previously called `accessCode` in OpenAPI 2.0. */
  authorizationCode?: AuthorizationCodeOauthFlowObject
}
