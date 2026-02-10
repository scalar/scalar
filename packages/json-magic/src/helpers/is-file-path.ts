import { isJsonObject } from '@/helpers/is-json-object'
import { isRemoteUrl } from '@/helpers/is-remote-url'
import { isYaml } from '@/helpers/is-yaml'

/**
 * Checks if a string represents a file path by ensuring it's not a remote URL,
 * YAML content, or JSON content.
 *
 * @param value - The string to check
 * @returns true if the string appears to be a file path, false otherwise
 * @example
 * ```ts
 * isFilePath('./schemas/user.json') // true
 * isFilePath('https://example.com/schema.json') // false
 * isFilePath('{"type": "object"}') // false
 * isFilePath('type: object') // false
 * ```
 */
export function isFilePath(value: string) {
  return !isRemoteUrl(value) && !isYaml(value) && !isJsonObject(value)
}
