import { type Static, coerce, literal, object, string, union, validate } from '@scalar/validation'

const deployEnvironments = union([literal('development'), literal('test'), literal('staging'), literal('production')])

const environmentSchema = object({
  VITE_ENV: deployEnvironments,
  VITE_API_URL: string(),
  VITE_SERVICES_URL: string(),
  VITE_DASHBOARD_URL: string(),
})

type ScalarAppEnv = Static<typeof environmentSchema>

/** Throws when required `VITE_*` variables are missing or invalid. */
export const assertScalarAppEnv = (env: unknown): ScalarAppEnv => {
  if (!validate(environmentSchema, env)) {
    throw new Error('Invalid environment variables')
  }

  return coerce(environmentSchema, env)
}
