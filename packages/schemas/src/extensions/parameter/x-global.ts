import { boolean, object, optional } from '@scalar/validation'

export const XGlobal = object(
  {
    'x-global': optional(boolean()),
  },
  {
    typeName: 'XGlobal',
    typeComment: 'Marks a parameter as global across the workspace',
  },
)
