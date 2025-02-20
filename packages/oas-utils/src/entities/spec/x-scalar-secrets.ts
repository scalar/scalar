import { z } from 'zod'

export const xScalarSecretVarSchema = z.object({
  description: z.string().optional(),
  example: z.string().optional(),
})

export const xScalarSecretsSchema = z.record(z.string(), xScalarSecretVarSchema)
export type XScalarSecrets = z.infer<typeof xScalarSecretsSchema>
