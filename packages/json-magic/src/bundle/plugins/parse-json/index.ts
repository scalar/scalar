import { isJsonObject } from '@/utils/is-json-object'
import type { LoaderPlugin, ResolveResult } from '@/bundle'

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
        }
      } catch {
        return {
          ok: false,
        }
      }
    },
  }
}
