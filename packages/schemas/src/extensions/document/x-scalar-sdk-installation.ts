import { array, object, optional, string } from '@scalar/validation'

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
    typeComment:
      'Scalar SDK installation instructions for the API description.\n\n@example\n```yaml\nx-scalar-sdk-installation:\n  - lang: shell\n    source: npm install @scalar/api-client\n```',
  },
)
