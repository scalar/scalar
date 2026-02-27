import type * as monaco from 'monaco-editor'

import type { JsonPath } from './json-path'

export const getJsonAstNodeAtPath = (
  node: monaco.languages.json.ASTNode | undefined,
  path: JsonPath,
): monaco.languages.json.ASTNode | undefined => {
  let current = node

  for (const segment of path) {
    if (!current) {
      return undefined
    }

    if (current.type === 'object') {
      const key = String(segment)
      const prop = current.properties.find((p) => p.keyNode.value === key)
      current = prop?.valueNode
      continue
    }

    if (current.type === 'array') {
      const index = typeof segment === 'number' ? segment : Number.parseInt(String(segment), 10)
      if (!Number.isFinite(index) || index < 0 || index >= current.items.length) {
        return undefined
      }
      current = current.items[index]
      continue
    }

    return undefined
  }

  return current
}
