import { array, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

const XScalarSdkInstallationItem = object(
  {
    lang: string({ typeComment: 'Programming language or platform (for example `TypeScript`, `Java`, `Python`)' }),
    description: optional(
      string({ typeComment: 'Installation instructions in Markdown (supports fenced code blocks)' }),
    ),
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
  - lang: TypeScript
    description: Install our SDK from npm with \`npm install @scalar/sdk\``,
    }),
  },
)
