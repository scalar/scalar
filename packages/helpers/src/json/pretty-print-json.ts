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
     * Always serialize through the reference-aware path. A plain JSON.stringify only
     * throws on *self*-referencing objects, but a structure that merely reuses the same
     * object reference in many places (a "diamond" graph) serializes without error — by
     * fully expanding every shared subtree. For a deeply shared graph that expansion grows
     * exponentially and freezes the tab. This happens with deeply resolved, recursive
     * OpenAPI schemas, where circular $refs are already cut to '[circular]' strings yet
     * sibling types remain shared. Collapsing repeated references keeps the output linear.
     */
    return replaceCircularDependencies(value)
  }

  return value?.toString() ?? ''
}

/**
 * JSON.stringify, but with repeated and circular references replaced with '[Circular]'.
 *
 * Note: parsing real JSON never yields shared references, so for ordinary parsed data
 * this produces output identical to a plain JSON.stringify.
 */
export function replaceCircularDependencies(content: any) {
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
