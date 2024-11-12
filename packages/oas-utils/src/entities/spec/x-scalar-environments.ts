import { z } from 'zod'

export type XScalarEnvVar = z.infer<typeof xScalarEnvVarSchema>

export const xScalarEnvVarSchema = z.union([
  z.object({
    description: z.string().optional(),
    default: z.string().default(''),
  }),
  z.string(),
])

export const xScalarEnvironmentSchema = z.object({
  description: z.string().optional(),
  color: z.string().optional(),
  /** A map of variables by name */
  variables: z.record(z.string(), xScalarEnvVarSchema),
})

/** A map of environments by name */
export const xScalarEnvironmentsSchema = z.record(
  /** Name */
  z.string(),
  /** Environment definition */
  xScalarEnvironmentSchema,
)

export type XScalarEnvironment = z.infer<typeof xScalarEnvironmentSchema>
export type XScalarEnvironments = z.infer<typeof xScalarEnvironmentsSchema>
