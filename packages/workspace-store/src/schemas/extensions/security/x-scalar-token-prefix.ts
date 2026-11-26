import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

/** A prefix added to header API keys only, separated from the credential by one space. */
export type XScalarTokenPrefix = {
  'x-scalar-token-prefix'?: string
}

export const XScalarTokenPrefixSchema = Type.Object({
  'x-scalar-token-prefix': Type.Optional(Type.String()),
})

export const XScalarTokenPrefix = object({
  'x-scalar-token-prefix': optional(string()),
})
