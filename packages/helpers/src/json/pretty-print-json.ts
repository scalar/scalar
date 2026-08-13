/**
 * Takes JSON and formats it.
 */
export const prettyPrintJson = (value: string | number | any[] | Record<any, any>): string => {
  // When the values is already a string it should be parsable
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      if (typeof parsed === 'object' && parsed !== null) {
        return JSON.stringify(parsed, null, 2)
      }

      return value
    } catch {
      return value
    }
  }

  if (typeof value === 'object') {
    /*
     * A structure that reuses the same object reference in many places (a "diamond" graph) gets
     * expanded once per path by JSON.stringify. That is the output we want, since a schema type
     * used by two properties should be shown for both. But for a deeply shared graph the expansion
     * grows exponentially and freezes the tab. This happens with deeply resolved, recursive OpenAPI
     * schemas, where circular $refs are already cut to '[circular]' strings yet sibling types remain
     * shared. So expand shared references, unless expanding them would blow up the output.
     */
    return countExpandedNodes(value, new Map()) > MAX_EXPANDED_NODES
      ? replaceRepeatedReferences(value)
      : replaceCircularDependencies(value)
  }

  return value?.toString() ?? ''
}

/** How many nodes the fully expanded output may hold before repeated references are collapsed. */
const MAX_EXPANDED_NODES = 100_000

/**
 * Counts the nodes a fully expanded JSON.stringify would emit, so a shared reference reachable
 * through many paths is counted once per path. Results are memoized, which keeps the walk itself
 * cheap even when the expanded count is astronomical.
 */
const countExpandedNodes = (value: any, cache: Map<object, number>): number => {
  if (typeof value !== 'object' || value === null) {
    return 1
  }

  const cached = cache.get(value)

  if (cached !== undefined) {
    return cached
  }

  // Seed the cache before recursing, so a circular reference does not loop forever
  cache.set(value, 1)

  let total = 1

  for (const child of Object.values(value)) {
    total += countExpandedNodes(child, cache)

    if (total > MAX_EXPANDED_NODES) {
      break
    }
  }

  cache.set(value, total)

  return total
}

/**
 * JSON.stringify, but with circular references replaced with '[Circular]'.
 *
 * Only references that are already on the current path are collapsed, so the same object used in
 * two sibling positions is expanded in both.
 */
export function replaceCircularDependencies(content: any) {
  const ancestors: any[] = []

  return JSON.stringify(
    content,
    function (this: any, _key, value) {
      if (typeof value !== 'object' || value === null) {
        return value
      }

      while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
        ancestors.pop()
      }

      if (ancestors.includes(value)) {
        return '[Circular]'
      }

      ancestors.push(value)

      return value
    },
    2,
  )
}

/**
 * JSON.stringify, but with repeated and circular references replaced with '[Circular]'.
 *
 * Note: parsing real JSON never yields shared references, so for ordinary parsed data
 * this produces output identical to a plain JSON.stringify.
 */
function replaceRepeatedReferences(content: any) {
  const cache = new Set()

  return JSON.stringify(
    content,
    (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]'
        }

        cache.add(value)
      }
      return value
    },
    2,
  )
}
