import type { Plugin, ResolveResult } from '@/utils/bundle/bundle'
import { isJson } from '@/utils/is-json'

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
export function parseJson(): Plugin {
  return {
    validate: (value) => isJson(value),
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
