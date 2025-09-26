import { Type } from '@scalar/typebox'

/**
 * The scalar redirect URI for the OAuth2 flow
 *
 * This should not be exported when exporting the document
 */
export const XScalarRedirectUriSchema = Type.Object({
  'x-scalar-redirect-uri': Type.String(),
})
