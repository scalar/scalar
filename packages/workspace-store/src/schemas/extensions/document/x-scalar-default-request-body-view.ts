import { Type } from '@scalar/typebox'
import { literal, object, optional, union } from '@scalar/validation'

/**
 * Schema for the x-scalar-default-request-body-view extension on an OpenAPI document.
 *
 * Sets the initial view of the request body editor for structured (JSON/YAML) bodies.
 * Use `form` to open the schema-driven form view by default, or `raw` for the code editor.
 * When the body cannot be shown as a form, Scalar falls back to `raw` automatically.
 *
 * @example
 * ```yaml
 * x-scalar-default-request-body-view: form
 * ```
 */
export const XScalarDefaultRequestBodyViewSchema = Type.Object({
  'x-scalar-default-request-body-view': Type.Optional(Type.Union([Type.Literal('form'), Type.Literal('raw')])),
})

export type XScalarDefaultRequestBodyView = {
  /** Initial request body editor view for structured bodies. Defaults to `raw`. */
  'x-scalar-default-request-body-view'?: 'form' | 'raw'
}

export const XScalarDefaultRequestBodyView = object(
  {
    'x-scalar-default-request-body-view': optional(union([literal('form'), literal('raw')])),
  },
  {
    typeName: 'XScalarDefaultRequestBodyView',
    typeComment: 'Initial request body editor view for structured bodies (form or raw)',
  },
)
