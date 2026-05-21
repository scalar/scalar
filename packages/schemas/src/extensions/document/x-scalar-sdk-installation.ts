import { array, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

const XScalarSdkInstallationItem = object(
  {
    lang: string({ typeComment: 'Programming language or platform (for example `shell`, `javascript`)' }),
    source: optional(string({ typeComment: 'Installation command or snippet source' })),
    description: optional(string({ typeComment: 'Human-readable description of this installation option' })),
  },
  {
    typeName: 'XScalarSdkInstallationItem',
    typeComment: 'One SDK installation instruction block',
  },
)

export const XScalarSdkInstallation = object(
  {
    'x-scalar-sdk-installation': optional(
      array(XScalarSdkInstallationItem, {
        typeComment: 'Installation instructions shown in the API reference',
      }),
    ),
  },
  {
    typeName: 'XScalarSdkInstallation',
    typeComment: typeCommentWithExample('Scalar SDK installation instructions for the API description.', {
      language: 'yaml',
      body: `x-scalar-sdk-installation:
  - lang: shell
    source: npm install @scalar/api-client`,
    }),
  },
)
