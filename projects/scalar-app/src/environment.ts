import { coerce, literal, object, string, union } from '@scalar/validation'

const deployEnvironments = union([literal('development'), literal('test'), literal('staging'), literal('production')])

const environmentSchema = object({
  VITE_ENV: deployEnvironments,
  VITE_SERVICES_URL: string(),
  VITE_DASHBOARD_URL: string(),
})

export const env = coerce(environmentSchema, import.meta.env)
