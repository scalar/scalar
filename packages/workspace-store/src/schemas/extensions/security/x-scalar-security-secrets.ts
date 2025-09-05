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
