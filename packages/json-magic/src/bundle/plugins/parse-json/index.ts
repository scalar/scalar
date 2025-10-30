import type { LoaderPlugin, ResolveResult } from '@/bundle'
import { isJsonObject } from '@/helpers/is-json-object'

/**
 * Creates a plugin that parses JSON strings into JavaScript objects.
 * @returns A plugin object with validate and exec functions
 * @example
 * ```ts
 * const jsonPlugin = parseJson()
 * const result = jsonPlugin.exec('{"name": "John", "age": 30}')
 * // result = { name: 'John', age: 30 }
 * ```
 */
export function parseJson(): LoaderPlugin {
  return {
    type: 'loader',
    validate: isJsonObject,
    exec: async (value): Promise<ResolveResult> => {
      try {
        return {
          ok: true,
          data: JSON.parse(value),
          raw: value,
        }
      } catch {
        return {
          ok: false,
        }
      }
    },
  }
}
