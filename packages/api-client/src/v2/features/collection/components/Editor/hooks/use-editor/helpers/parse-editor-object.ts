import { isObject } from '@scalar/helpers/object/is-object'
import { parse as parseYaml } from 'yaml'

export type ParsedDocument = Record<string, unknown>

const safeParseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const safeParseYaml = (value: string): unknown => {
  try {
    return parseYaml(value)
  } catch {
    return null
  }
}

/**
 * Parses the editor value string in either JSON or YAML format.
 * Returns the parsed object if valid and an object, otherwise returns null.
 *
 * @param value - The input string to parse.
 * @param language - The language of the input string, either 'json' or 'yaml'.
 * @returns The parsed object if it's valid, or null.
 */
export const parseEditorObject = (value: string, language: 'json' | 'yaml'): ParsedDocument | null => {
  const parsed = language === 'yaml' ? safeParseYaml(value) : safeParseJson(value)
  if (!isObject(parsed)) {
    return null
  }

  return parsed
}
