import { z } from 'zod'

const xScalarSecretVarSchema = z.object({
  description: z.string().optional(),
  example: z.string().optional(),
})

export const xScalarSecretsSchema = z.record(z.string(), xScalarSecretVarSchema)
// not used but kept for consistency
// export type XScalarSecrets = z.infer<typeof xScalarSecretsSchema>
