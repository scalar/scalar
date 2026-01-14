import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

/**
 * Flattens the environment variables array into a key-value object.
 * If a variable value is a string, use it directly; otherwise, use its default value.
 *
 * @returns An object mapping variable names to their resolved values.
 */
export const getEnvironmentVariables = (environment: XScalarEnvironment) => {
  return environment.variables.reduce(
    (acc, curr) => {
      acc[curr.name] = typeof curr.value === 'string' ? curr.value : curr.value.default
      return acc
    },
    {} as Record<string, string>,
  )
}
