import { stringify as stringifyYaml } from 'yaml'

/**
 * Stringifies a JavaScript object/document into a formatted string.
 * Uses YAML format if language is 'yaml', otherwise uses JSON.
 *
 * @param document - The JavaScript object to stringify
 * @param language - Output language, expected to be either 'json' or 'yaml'
 * @returns The stringified document in the specified language
 */
export const stringifyDocument = (document: unknown, language: 'json' | 'yaml'): string => {
  if (language === 'yaml') {
    return stringifyYaml(document, { indent: 2 })
  }

  return JSON.stringify(document, null, 2)
}
