type RemoveCircularOptions = {
  /** Prefix to add before the path in $ref values */
  prefix?: string
}

/**
 * Recursively processes an object and replaces circular references with JSON Reference objects.
 * When a circular reference is detected, it returns `{ $ref: "#/path/to/original" }`.
 *
 * @param obj - The object to process
 * @param options - Configuration options
 * @returns A new object with circular references replaced by $ref pointers
 */
export const removeCircular = <T>(obj: T, options: RemoveCircularOptions = {}): T => {
  const { prefix = '' } = options
  const cache = new WeakMap<object, string>()

  const dfs = (node: unknown, path: string = ''): unknown => {
    // Primitives and null are returned as-is
    if (typeof node !== 'object' || node === null) {
      return node
    }

    // Circular reference detected - return a $ref
    if (cache.has(node)) {
      return { $ref: `#${prefix}${cache.get(node)}` }
    }

    // Mark this object as seen with its path
    cache.set(node, path)

    // Handle arrays
    if (Array.isArray(node)) {
      return node.map((item, index) => dfs(item, `${path}/${index}`))
    }

    // Handle objects - create a new object with processed values
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node)) {
      result[key] = dfs(value, `${path}/${key}`)
    }

    return result
  }

  return dfs(obj) as T
}
