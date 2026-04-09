import { Type } from '@scalar/typebox'
import { boolean, object, optional } from '@scalar/validation'

export const XScalarIgnoreSchema = Type.Object({
  'x-scalar-ignore': Type.Optional(Type.Boolean()),
})

export type XScalarIgnore = {
  /** Internal extension to mark an entity as ignored */
  'x-scalar-ignore'?: boolean
}

export const XScalarIgnore = object(
  {
    'x-scalar-ignore': optional(boolean()),
  },
  {
    typeName: 'XScalarIgnore',
    typeComment: 'Internal extension to mark an entity as ignored',
  },
)
