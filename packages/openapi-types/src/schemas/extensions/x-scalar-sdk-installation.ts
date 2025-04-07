import { z } from 'zod'

export const XScalarSdkInstallationSchema = z.object({
  'x-scalar-sdk-installation': z
    .object({
      lang: z.string(),
      source: z.string(),
    })
    .array()
    .optional()
    .catch(undefined),
})
