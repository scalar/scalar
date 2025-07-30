import { parse } from 'yaml'

export function isYaml(value: string) {
  // Line breaks
  if (!value.includes('\n')) {
    return false
  }

  try {
    parse(value, {
      maxAliasCount: 10000,
    })

    return true
  } catch (_error) {
    return false
  }
}
