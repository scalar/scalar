import { objectEntries } from '@scalar/helpers/object/object-entries'

import type { ServerObject } from '@/schemas/v3.2/strict/server'

/**
 * Extracts the default values of variables defined in a ServerObject into a simple key-value map.
 * Keeps empty string defaults because an empty value is a valid substitution. Ignores variables with no default value.
 *
 * @param server The OpenAPI ServerObject (may be null).
 * @returns Record of variableName -> defaultValue.
 */
export const getServerVariables = (server: ServerObject | null): Record<string, string> =>
  Object.fromEntries(
    objectEntries(server?.variables ?? {}).flatMap(([name, variable]) =>
      variable.default === undefined ? [] : [[name, variable.default] as const],
    ),
  )
