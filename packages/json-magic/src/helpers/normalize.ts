import { parse } from 'yaml'

import { normalizeWithoutYaml, yamlParseOptions } from '@/helpers/normalize-async'

/**
 * Normalize a string (YAML, JSON, object) to a JavaScript datatype.
 *
 * This keeps the `yaml` package as a static dependency so it can answer synchronously. Where the caller
 * can wait, prefer `normalizeAsync`, which only loads the parser when the content is YAML.
 */
export function normalize(content: unknown): unknown {
  const result = normalizeWithoutYaml(content)

  if ('value' in result) {
    return result.value
  }

  return parse(result.yaml, yamlParseOptions)
}
