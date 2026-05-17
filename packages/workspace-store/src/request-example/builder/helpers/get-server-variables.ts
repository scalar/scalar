import type { ServerObject } from '@scalar/types/openapi/3.1'

/**
 * Extracts the default values of variables defined in a ServerObject into a simple key-value map.
 * Ignores variables with no default value.
 *
 * @param server The OpenAPI ServerObject (may be null).
 * @returns Record of variableName -> defaultValue.
 */
export const getServerVariables = (server: ServerObject | null) => {
  if (!server) {
    return {}
  }
  return Object.entries(server?.variables ?? {}).reduce<Record<string, string>>((acc, [name, variable]) => {
    if (variable.default) {
      acc[name] = variable.default
    }
    return acc
  }, {})
}
