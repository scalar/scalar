import { parse, stringify } from 'yaml'

import { type AnyObject } from './types'

export const yaml = {
  parse,
  stringify,
}

/** Parses a JSON or Yaml object or string into an object */
export const loadJsonOrYaml = (value: string | AnyObject): AnyObject => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as AnyObject
    } catch (error) {
      // String starts with { or [, so it’s probably JSON.
      if (value.length > 0 && ['{', '['].includes(value[0])) {
        throw error
      }

      // Then maybe it’s YAML?
      return yaml.parse(value) as AnyObject
    }
  }

  return value as AnyObject
}

/** Validates a JSON string if provided. Otherwise returns the raw Yaml */
export function loadJsonOrYamlString(value: string) {
  // If we don't start with a bracket assume yaml
  const trimmed = value.trim()
  if (trimmed[0] !== '{') return value

  try {
    // JSON
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    // Yaml
    return value
  }
}
