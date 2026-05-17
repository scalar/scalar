import { array, object, optional, string } from '@scalar/validation'

const XScalarSdkInstallationItem = object(
  {
    lang: string(),
    source: optional(string()),
    description: optional(string()),
  },
  {
    typeName: 'XScalarSdkInstallationItem',
    typeComment: 'Scalar SDK installation entry',
  },
)

export const XScalarSdkInstallation = object(
  {
    'x-scalar-sdk-installation': optional(
      array(XScalarSdkInstallationItem, {
        typeComment: 'Scalar SDK installation information',
      }),
    ),
  },
  {
    typeName: 'XScalarSdkInstallation',
    typeComment: 'Scalar SDK installation information',
  },
)
