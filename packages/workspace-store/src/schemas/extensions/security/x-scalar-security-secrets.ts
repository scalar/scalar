import { Type } from '@scalar/typebox'

/**
 * A scalar secret token
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretTokenSchema = Type.Object({
  'x-scalar-secret-token': Type.Optional(Type.String()),
})

/**
 * Username and password for HTTP authentication
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretHTTPSchema = Type.Object({
  'x-scalar-secret-username': Type.Optional(Type.String()),
  'x-scalar-secret-password': Type.Optional(Type.String()),
})

/**
 * Oauth client secret
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretClientSecretSchema = Type.Object({
  'x-scalar-secret-client-secret': Type.Optional(Type.String()),
})

/**
 * Oauth client ID
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretClientIdSchema = Type.Object({
  'x-scalar-secret-client-id': Type.Optional(Type.String()),
})

/**
 * Oauth Redirect URI
 *
 * We should not export this when exporting the document
 */
export const XScalarSecretRedirectUriSchema = Type.Object({
  'x-scalar-secret-redirect-uri': Type.Optional(Type.String()),
})
