/**
 * Security scheme Scalar extensions.
 *
 * Applied on OpenAPI `components.securitySchemes` entries. Configures OAuth2 behavior, credential
 * placement, PKCE, default scopes, and persisted secrets (not exported with the document).
 */
export { XDefaultScopes } from './x-default-scopes'
export { XScalarCredentialsLocation } from './x-scalar-credentials-location'
export { XScalarSecurityBody } from './x-scalar-security-body'
export { XScalarSecurityQuery } from './x-scalar-security-query'
export {
  XScalarAuthUrl,
  XScalarSecretClientId,
  XScalarSecretClientSecret,
  XScalarSecretHTTP,
  XScalarSecretRedirectUri,
  XScalarSecretRefreshToken,
  XScalarSecretToken,
  XScalarTokenUrl,
} from './x-scalar-security-secrets'
export { XTokenName } from './x-tokenName'
export { XusePkce } from './x-use-pkce'
