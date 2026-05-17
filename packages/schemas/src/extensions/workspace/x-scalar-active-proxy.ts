import { nullable, object, optional, string, union } from '@scalar/validation'

export const XScalarActiveProxy = object(
  {
    'x-scalar-active-proxy': optional(union([string(), nullable()])),
  },
  {
    typeName: 'XScalarActiveProxy',
    typeComment: 'Active proxy URL for the workspace',
  },
)
