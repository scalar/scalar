import { Type } from '@scalar/typebox'
import { boolean, object, optional } from '@scalar/validation'

/**
 * Schema for the "x-scalar-is-dirty" OpenAPI extension.
 * This extension allows specifying an optional boolean value,
 * which can be used to track if the document state is dirty.
 *
 * This is used to track if the document has been modified since it was last saved.
 *
 * @example
 * ```yaml
 * x-scalar-is-dirty: true
 * ```
 *
 * @example
 * ```yaml
 * x-scalar-is-dirty: false
 * ```
 */
export const XScalarIsDirtySchema = Type.Object({
  /** Whether the document state is dirty, this is used to track if the document has been modified since it was last saved */
  'x-scalar-is-dirty': Type.Optional(Type.Boolean()),
})

/**
 * Schema for the "x-scalar-is-dirty" OpenAPI extension.
 * This extension allows specifying an optional boolean value,
 * which can be used to track if the document state is dirty.
 *
 * This is used to track if the document has been modified since it was last saved.
 *
 * @example
 * ```yaml
 * x-scalar-is-dirty: true
 * ```
 *
 * @example
 * ```yaml
 * x-scalar-is-dirty: false
 * ```
 */
export type XScalarIsDirty = {
  /** Whether the document state is dirty, this is used to track if the document has been modified since it was last saved */
  'x-scalar-is-dirty'?: boolean
}

export const XScalarIsDirty = object(
  {
    'x-scalar-is-dirty': optional(
      boolean({
        typeComment:
          'Whether the document state is dirty, this is used to track if the document has been modified since it was last saved',
      }),
    ),
  },
  {
    typeName: 'XScalarIsDirty',
    typeComment: 'Tracks whether the document has been modified since it was last saved',
  },
)
