import { Type } from '@scalar/typebox'

/**
 * A scalar secret token
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretTokenSchema = Type.Object({
  'x-scalar-secret-token': Type.String(),
})

/**
 * A scalar secret token
 *
 * We should not export this when exporting the document
 */
export type XScalarSecretToken = {
  'x-scalar-secret-token': string
}

/**
 * Username and password for HTTP authentication
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretHTTPSchema = Type.Object({
  'x-scalar-secret-username': Type.String(),
  'x-scalar-secret-password': Type.String(),
})

/**
 * Username and password for HTTP authentication
 *
 * We should not export this when exporting the document
 */
export type XScalarSecretHTTP = {
  'x-scalar-secret-username': string
  'x-scalar-secret-password': string
}

/**
 * Oauth client secret
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretClientSecretSchema = Type.Object({
  'x-scalar-secret-client-secret': Type.String(),
})

/**
 * Oauth client secret
 *
 * We should not export this when exporting the document
 */
export type XScalarSecretClientSecret = {
  'x-scalar-secret-client-secret': string
}

/**
 * Oauth client ID
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretClientIdSchema = Type.Object({
  'x-scalar-secret-client-id': Type.String(),
})

/**
 * Oauth client ID
 *
 * We should not export this when exporting the document
 */
export type XScalarSecretClientId = {
  'x-scalar-secret-client-id': string
}

/**
 * Oauth Redirect URI
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretRedirectUriSchema = Type.Object({
  'x-scalar-secret-redirect-uri': Type.String(),
})

/**
 * Oauth Redirect URI
 *
 * We should not export this when exporting the document
 */
export type XScalarSecretRedirectUri = {
  'x-scalar-secret-redirect-uri': string
}
