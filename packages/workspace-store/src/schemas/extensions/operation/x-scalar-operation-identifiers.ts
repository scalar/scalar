import { Type } from '@scalar/typebox'

/**
 * path and method identifiers for Scalar operations
 *
 * Used internally by Scalar to keep track of operations
 * as a draft state when you edit the path/method before saving the new operation
 */
export const XScalarOperationIdentifiers = Type.Object({
  'x-scalar-path': Type.Optional(Type.String()),
  'x-scalar-method': Type.Optional(Type.String()),
})
