import { object, optional, string } from '@scalar/validation'

/** The currently selected environment for this API description */
export const XScalarActiveEnvironment = object(
  {
    'x-scalar-active-environment': optional(string({ typeComment: 'The currently selected environment name' })),
  },
  {
    typeName: 'XScalarActiveEnvironment',
    typeComment:
      'The currently selected environment for this API description.\n\n@example\n```yaml\nx-scalar-active-environment: production\n```',
  },
)
