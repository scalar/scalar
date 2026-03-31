import { Type } from '@scalar/typebox'
import { array, object, optional, string } from '@scalar/validation'

const XScalarSdkInstallationItemSchema = Type.Object({
  lang: Type.String(),
  source: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
})

export const XScalarSdkInstallationSchema = Type.Object({
  'x-scalar-sdk-installation': Type.Optional(Type.Array(XScalarSdkInstallationItemSchema)),
})

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

export type XScalarSdkInstallation = {
  /** Scalar SDK installation information. */
  'x-scalar-sdk-installation'?: {
    lang: string
    source?: string
    description?: string
  }[]
}

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
