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
     * A structure that reuses the same object reference in many places (a "diamond" graph) is
     * expanded once per path, so a schema type used by two properties is shown for both. But a
     * deeply shared graph expands exponentially and would freeze the tab. This happens with deeply
     * resolved, recursive OpenAPI schemas, where circular $refs are already cut to '[circular]'
     * strings yet sibling types remain shared. So we expand shared references up to a node budget,
     * and fall back to collapsing every repeated reference once that budget is exceeded, which keeps
     * the output linear no matter how the graph is shaped.
     */
    try {
      return replaceCircularDependencies(value)
    } catch (error) {
      if (error === EXPANSION_LIMIT_EXCEEDED) {
        return replaceRepeatedReferences(value)
      }

      throw error
    }
  }

  return value?.toString() ?? ''
}

/** How many nodes the expanded output may hold before repeated references are collapsed. */
const MAX_EXPANDED_NODES = 100_000

/**
 * Sentinel thrown to unwind out of JSON.stringify once the expanded output grows past the node
 * budget. A single shared instance is reused, so recognizing it is a cheap identity check.
 */
const EXPANSION_LIMIT_EXCEEDED = new Error('Expanded JSON exceeded the node limit')

/**
 * JSON.stringify, but with circular references replaced with '[Circular]'.
 *
 * Only references that are already on the current path are collapsed, so the same object used in
 * two sibling positions is expanded in both. Expanding a deeply shared graph can still blow up
 * exponentially, so the number of emitted nodes is capped: once it passes MAX_EXPANDED_NODES the
 * walk throws EXPANSION_LIMIT_EXCEEDED, which prettyPrintJson catches to fall back to collapsing
 * every repeated reference.
 */
export function replaceCircularDependencies(content: any) {
  const ancestors: any[] = []
  let expandedNodes = 0

  return JSON.stringify(
    content,
    function (this: any, _key, value) {
      expandedNodes += 1

      if (expandedNodes > MAX_EXPANDED_NODES) {
        throw EXPANSION_LIMIT_EXCEEDED
      }

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
