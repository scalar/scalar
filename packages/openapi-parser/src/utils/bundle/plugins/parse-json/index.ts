import type { Plugin } from '@/utils/bundle/bundle'
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
    exec: (value) => JSON.parse(value),
  }
}
