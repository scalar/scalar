import { Type } from '@scalar/typebox'
import { array, object, optional, string } from '@scalar/validation'

const XScalarSdkInstallationItemSchema = Type.Object({
  lang: Type.String(),
  description: Type.Optional(Type.String()),
  source: Type.Optional(Type.String()),
})

export const XScalarSdkInstallationSchema = Type.Object({
  'x-scalar-sdk-installation': Type.Optional(Type.Array(XScalarSdkInstallationItemSchema)),
})

const XScalarSdkInstallationItem = object(
  {
    lang: string(),
    description: optional(string()),
    source: optional(string()),
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
    /** Installation instructions in Markdown (supports fenced code blocks). */
    description?: string
    /**
     * @deprecated Use `description` instead. Kept for backwards compatibility:
     * when set, it is appended to `description` as a fenced code block (or used
     * on its own when there is no `description`).
     */
    source?: string
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
