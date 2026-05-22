import { type Schema, type Static, coerce, literal, object, string, union, validate } from '@scalar/validation'

const deployEnvironments = union([literal('development'), literal('test'), literal('staging'), literal('production')])

const environmentSchema = object({
  VITE_ENV: deployEnvironments,
  VITE_API_URL: string(),
  VITE_SERVICES_URL: string(),
  VITE_DASHBOARD_URL: string(),
})

type ScalarAppEnv = Static<typeof environmentSchema>

/** Human-readable description of what a property schema accepts, for error messages. */
const describeExpected = (schema: Schema): string => {
  if (schema.type === 'union') {
    return schema.schemas.map((member) => ('value' in member ? JSON.stringify(member.value) : member.type)).join(' | ')
  }

  return `a ${schema.type}`
}

/** Collect a per-variable explanation for every property that fails validation. */
const collectProblems = (env: Record<string, unknown>): string[] =>
  Object.entries(environmentSchema.properties).flatMap(([key, schema]) => {
    if (validate(schema, env[key])) {
      return []
    }

    const reason =
      env[key] === undefined ? 'is missing' : `is ${JSON.stringify(env[key])}, expected ${describeExpected(schema)}`

    return [`${key} ${reason}`]
  })

/**
 * Throws when required `VITE_*` variables are missing or invalid.
 *
 * The thrown error lists every offending variable (missing vs. wrong type/value)
 * so a failed build or test run points straight at the `.env` file to fix.
 */
export const assertScalarAppEnv = (env: unknown): ScalarAppEnv => {
  // `import.meta.env` and other host-provided env objects are not always plain
  // objects — Vitest, for example, backs `import.meta.env` onto `process.env`
  // via a custom prototype, which the schema's plain-object check rejects.
  // Copy the own enumerable keys into a plain object so validation can read them.
  const normalized: Record<string, unknown> = env && typeof env === 'object' ? { ...env } : {}

  if (!validate(environmentSchema, normalized)) {
    const problems = collectProblems(normalized)

    throw new Error(`Invalid environment variables:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`)
  }

  return coerce(environmentSchema, normalized)
}
