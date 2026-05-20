import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/** The currently selected environment for this API description */
export const XScalarActiveEnvironment = object(
  {
    'x-scalar-active-environment': optional(string({ typeComment: 'The currently selected environment name' })),
  },
  {
    typeName: 'XScalarActiveEnvironment',
    typeComment: typeCommentWithExample('The currently selected environment for this API description.', {
      language: 'yaml',
      body: 'x-scalar-active-environment: production',
    }),
  },
)
