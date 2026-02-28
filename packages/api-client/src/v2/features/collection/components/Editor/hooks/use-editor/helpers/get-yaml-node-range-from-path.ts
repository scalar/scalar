import { isMap, isPair, isScalar, isSeq, parseDocument } from 'yaml'

import type { JsonPath } from './json-ast'

export type YamlNodeRange = {
  startOffset: number
  endOffset: number
}

const isValidYamlRange = (range: unknown): range is readonly [number, number, ...unknown[]] =>
  Array.isArray(range) && typeof range[0] === 'number' && typeof range[1] === 'number'

const safeParseDocument = (yamlText: string) => {
  try {
    return parseDocument(yamlText)
  } catch {
    return null
  }
}

/**
 * Finds the byte range (offset) in the YAML text corresponding to a JSON path.
 * Given a YAML string and a path (array of segments), parses the document and walks
 * down the tree to find the target node or key, returning its start and end offsets.
 * Will prefer to highlight the "key" part for map entries, to avoid highlighting the value which
 * might be offset due to block structure.
 *
 * @param yamlText The YAML string
 * @param path An array representing the path to traverse
 * @returns The byte offsets in the YAML string of the node (or null if not found)
 */
export const getYamlNodeRangeFromPath = (yamlText: string, path: JsonPath): YamlNodeRange | null => {
  const doc = safeParseDocument(yamlText)
  if (!doc) {
    return null
  }

  let current: unknown = doc.contents
  let lastPair: unknown = null

  // Traverse the path, descending through maps and sequences as needed.
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
        // Path segment does not exist in this map
        return null
      }

      lastPair = pair
      current = pair.value
      continue
    }

    if (isSeq(current)) {
      // Ensure we have a valid integer index for arrays
      const index = typeof segment === 'number' ? segment : Number.parseInt(String(segment), 10)
      if (!Number.isFinite(index) || index < 0 || index >= current.items.length) {
        return null
      }

      lastPair = null
      current = current.items[index]
      continue
    }

    // If current isn't traversable
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

  // For non-map entries, just use the node's own range property if it exists.
  const nodeRange = (current as { range?: unknown } | null)?.range
  if (!isValidYamlRange(nodeRange)) {
    return null
  }

  const startOffset = Math.max(0, nodeRange[0])
  const endOffset = Math.max(startOffset, nodeRange[1])

  return { startOffset, endOffset }
}
