// @ts-ignore
import { load } from 'js-yaml'

export function isYaml(value: string) {
  // Line breaks
  if (!value.includes('\n')) {
    return false
  }

  try {
    load(value, {
      // maxAliasCount: 10000,
    })

    return true
  } catch (error) {
    return false
  }
}
