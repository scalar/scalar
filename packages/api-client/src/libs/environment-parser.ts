import type { EnvVariables } from '@/libs/env-helpers'

/** Parses the active environment variables and extracts key-value pairs. */
export function parseEnvVariables(activeEnvVariables: EnvVariables) {
  return activeEnvVariables.flatMap((variable) => {
    if (variable.key === 'value') {
      try {
        const parsedValue = JSON.parse(variable.value)
        return Object.keys(parsedValue).map((key) => ({
          key,
          value: parsedValue[key],
          source: variable.source,
        }))
      } catch (_e) {
        // Skip invalid environment editor JSON entries
      }
    }
    return [variable]
  })
}
