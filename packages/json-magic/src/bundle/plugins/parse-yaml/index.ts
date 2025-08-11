import type { LoaderPlugin, ResolveResult } from '@/bundle'
import { isYaml } from '@/utils/is-yaml'
import YAML from 'yaml'

/**
 * Creates a plugin that parses YAML strings into JavaScript objects.
 * @returns A plugin object with validate and exec functions
 * @example
 * ```ts
 * const yamlPlugin = parseYaml()
 * const result = yamlPlugin.exec('name: John\nage: 30')
 * // result = { name: 'John', age: 30 }
 * ```
 */
export function parseYaml(): LoaderPlugin {
  return {
    type: 'loader',
    validate: isYaml,
    exec: async (value): Promise<ResolveResult> => {
      try {
        return {
          ok: true,
          data: YAML.parse(value),
        }
      } catch {
        return {
          ok: false,
        }
      }
    },
  }
}
