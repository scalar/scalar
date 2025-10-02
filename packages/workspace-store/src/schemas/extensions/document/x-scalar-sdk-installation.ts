import { Type } from '@scalar/typebox'

export const XScalarSdkInstallationSchema = Type.Object({
  'x-scalar-sdk-installation': Type.Optional(
    Type.Array(
      Type.Object({
        lang: Type.String(),
        source: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
      }),
    ),
  ),
})

export type XScalarSdkInstallation = {
  /** Scalar SDK installation information. */
  'x-scalar-sdk-installation'?: {
    lang: string
    source?: string
    description?: string
  }[]
}
