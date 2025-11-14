import { HTTP_METHODS, type HttpMethod } from '@scalar/helpers/http/http-methods'
import { type TLiteral, Type } from '@scalar/typebox'

/**
 * path and method identifiers for Scalar operations
 *
 * Used internally by Scalar to keep track of operations
 * as a draft state when you edit the path/method before saving the new operation
 */
export const XScalarOperationIdentifiersSchema = Type.Object({
  'x-scalar-path': Type.Optional(Type.String()),
  'x-scalar-method': Type.Optional(
    Type.Union(HTTP_METHODS.map((method) => Type.Literal(method))) as unknown as TLiteral<HttpMethod>,
  ),
})

export type XScalarOperationIdentifiers = {
  'x-scalar-path'?: string
  'x-scalar-method'?: HttpMethod
}
