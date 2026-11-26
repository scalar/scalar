import { YAML_MAX_ALIAS_COUNT } from '@scalar/helpers/general/yaml-max-alias-count'
import { parse } from 'yaml'

/**
 * Check whether a multi-line string parses as YAML.
 */
export function isYaml(value: string): boolean {
  // Line breaks
  if (!value.includes('\n')) {
    return false
  }

  try {
    parse(value, {
      maxAliasCount: YAML_MAX_ALIAS_COUNT,
    })

    return true
  } catch (_error) {
    return false
  }
}
