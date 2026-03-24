import { objectEntries } from '@scalar/helpers/object/object-entries'

import type { ServerObject } from '@/schemas/v3.1/strict/server'

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
  return objectEntries(server?.variables ?? {}).reduce<Record<string, string>>((acc, [name, variable]) => {
    if (variable.default) {
      acc[name] = variable.default
    }
    return acc
  }, {})
}
