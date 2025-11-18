import { Type } from '@scalar/typebox'

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
  'x-scalar-active-proxy': Type.Optional(Type.String()),
})

export type XScalarActiveProxy = {
  /** The currently selected proxy */
  'x-scalar-active-proxy'?: string
}
