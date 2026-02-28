import { isMap, isPair, isScalar, isSeq, parseDocument } from 'yaml'

import type { JsonPath } from './json-path'

export type YamlNodeRange = {
  startOffset: number
  endOffset: number
}

const isValidYamlRange = (
  range: unknown,
): range is readonly [number, number, ...unknown[]] =>
  Array.isArray(range) &&
  typeof range[0] === 'number' &&
  typeof range[1] === 'number'

export const getYamlNodeRangeFromPath = (
  yamlText: string,
  path: JsonPath,
): YamlNodeRange | null => {
  try {
    const doc = parseDocument(yamlText)
    let current: unknown = doc.contents
    let lastPair: unknown = null

    for (const segment of path) {
      if (isMap(current)) {
        const key = String(segment)
        const pair = current.items.find((p) => {
          if (!isPair(p)) {
            return false
          }
          const pairKey = p.key
          return isScalar(pairKey) ? String(pairKey.value) === key : String(pairKey) === key
        })

        if (!pair || !isPair(pair)) {
          return null
        }

        lastPair = pair
        current = pair.value
        continue
      }

      if (isSeq(current)) {
        const index =
          typeof segment === 'number'
            ? segment
            : Number.parseInt(String(segment), 10)
        if (!Number.isFinite(index) || index < 0 || index >= current.items.length) {
          return null
        }

        lastPair = null
        current = current.items[index]
        continue
      }

      return null
    }

    // Prefer highlighting the key line for map entries (avoids being off-by-one line for block values).
    if (lastPair && isPair(lastPair)) {
      const keyRange = (lastPair.key as { range?: unknown } | null)?.range
      const valueRange = (lastPair.value as { range?: unknown } | null)?.range

      if (!isValidYamlRange(keyRange)) {
        return null
      }

      const startOffset = Math.max(0, keyRange[0])
      const endOffset = isValidYamlRange(valueRange)
        ? Math.max(startOffset, valueRange[1])
        : Math.max(startOffset, keyRange[1])

      return { startOffset, endOffset }
    }

    const nodeRange = (current as { range?: unknown } | null)?.range
    if (!isValidYamlRange(nodeRange)) {
      return null
    }

    const startOffset = Math.max(0, nodeRange[0])
    const endOffset = Math.max(startOffset, nodeRange[1])

    return { startOffset, endOffset }
  } catch {
    return null
  }
}

