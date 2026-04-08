import type { ApiKeySecurityObject } from './api-key-security'
import type { BasicAuthenticationSecurityObject } from './basic-authentication-security'
import type { Oauth2AccessCodeSecurityObject } from './oauth2-access-code-security'
import type { Oauth2ApplicationSecurityObject } from './oauth2-application-security'
import type { Oauth2ImplicitSecurityObject } from './oauth2-implicit-security'
import type { Oauth2PasswordSecurityObject } from './oauth2-password-security'
/**
 * Security Definitions object
 *
 * A declaration of the security schemes available to be used in the specification. This does not enforce the security schemes on the operations and only serves to provide the relevant details for each scheme.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#security-definitions-object}
 */
export type SecurityDefinitionsObject = {
  [key: string]:
    | BasicAuthenticationSecurityObject
    | ApiKeySecurityObject
    | Oauth2ImplicitSecurityObject
    | Oauth2PasswordSecurityObject
    | Oauth2ApplicationSecurityObject
    | Oauth2AccessCodeSecurityObject
}
