import { Type } from '@scalar/typebox'
import { nullable, object, optional, string, union } from '@scalar/validation'

/**
 * Schema for the x-scalar-active-proxy extension.
 *
 * This property indicates the currently selected proxy's identifier.
 *
 * @example
 * {
 *   "x-scalar-active-proxy": "my-proxy-id"
 * }
 */
export const XScalarActiveProxySchema = Type.Object({
  'x-scalar-active-proxy': Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

export type XScalarActiveProxy = {
  /** The currently selected proxy */
  'x-scalar-active-proxy'?: string | null
}

export const XScalarActiveProxy = object(
  {
    'x-scalar-active-proxy': optional(union([string(), nullable()], { typeComment: 'The currently selected proxy' })),
  },
  {
    typeName: 'XScalarActiveProxy',
    typeComment: 'The currently selected proxy identifier',
  },
)
