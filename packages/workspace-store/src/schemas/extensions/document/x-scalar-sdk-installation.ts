import { Type } from '@sinclair/typebox'
import type { Static } from '@sinclair/typebox'

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

export type XScalarSdkInstallation = Static<typeof XScalarSdkInstallationSchema>
