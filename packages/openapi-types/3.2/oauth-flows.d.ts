import type { AuthorizationCodeObject } from './authorization-code'
import type { ClientCredentialsObject } from './client-credentials'
import type { DeviceAuthorizationObject } from './device-authorization'
import type { ImplicitObject } from './implicit'
import type { PasswordObject } from './password'
/**
 * Oauth Flows object
 *
 * Allows configuration of the supported OAuth Flows.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2#oauth-flows-object}
 */
export type OauthFlowsObject = {
  /** Configuration for the OAuth Implicit flow */
  implicit?: ImplicitObject
  /** Configuration for the OAuth Resource Owner Password flow */
  password?: PasswordObject
  /** Configuration for the OAuth Client Credentials flow. Previously called `application` in OpenAPI 2.0. */
  clientCredentials?: ClientCredentialsObject
  /** Configuration for the OAuth Authorization Code flow. Previously called `accessCode` in OpenAPI 2.0. */
  authorizationCode?: AuthorizationCodeObject
  /** Configuration for the OAuth Device Authorization flow. */
  deviceAuthorization?: DeviceAuthorizationObject
} & Record<`x-${string}`, unknown>
