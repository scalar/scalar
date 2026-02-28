import { Queue } from '@/queue/queue'

type RemoveCircularOptions = {
  /** Prefix to add before the path in $ref values */
  prefix?: string
  /** Cache of already processed objects */
  cache?: WeakMap<object, string>
}

const escapeJsonPointer = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1')

/**
 * Traverses an object or array, returning a deep copy in which circular references are replaced
 * by JSON Reference objects of the form: `{ $ref: "#/path/to/original" }`.
 * This allows safe serialization of objects with cycles, following the JSON Reference convention (RFC 6901).
 * An optional `prefix` for the `$ref` path can be provided via options.
 *
 * @param obj - The input object or array to process
 * @param options - Optional configuration; you can set a prefix for $ref pointers
 * @returns A new object or array, with all circular references replaced by $ref pointers
 */
export const toJsonCompatible = <T>(obj: T, options: RemoveCircularOptions = {}): T => {
  const { prefix = '', cache = new WeakMap<object, string>() } = options

  const toRef = (path: string | undefined) => ({ $ref: `#${path ?? ''}` })

  // Primitives and null are returned as-is
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const rootPath = prefix
  cache.set(obj as object, rootPath)

  const rootResult: unknown = Array.isArray(obj) ? new Array((obj as unknown[]).length) : {}

  const queue = new Queue<{ node: object; result: unknown; path: string }>()
  queue.enqueue({ node: obj as object, result: rootResult, path: rootPath })

  while (!queue.isEmpty()) {
    const frame = queue.dequeue()
    if (!frame) {
      continue
    }

    const { node, result, path } = frame

    // Handle arrays (preserve sparse arrays like Array#map does)
    if (Array.isArray(node)) {
      const input = node as unknown[]
      const out = result as unknown[]

      for (let index = 0; index < input.length; index++) {
        if (!(index in input)) {
          continue
        }

        const item = input[index]
        const itemPath = `${path}/${index}`

        if (typeof item !== 'object' || item === null) {
          out[index] = item
          continue
        }

        const existingPath = cache.get(item as object)
        if (existingPath !== undefined) {
          out[index] = toRef(existingPath)
          continue
        }

        cache.set(item as object, itemPath)

        const childResult: unknown = Array.isArray(item) ? new Array((item as unknown[]).length) : {}
        out[index] = childResult
        queue.enqueue({ node: item as object, result: childResult, path: itemPath })
      }

      continue
    }

    // Handle objects - create a new object with processed values
    const out = result as Record<string, unknown>
    for (const [key, value] of Object.entries(node)) {
      const valuePath = `${path}/${escapeJsonPointer(key)}`

      if (typeof value !== 'object' || value === null) {
        out[key] = value
        continue
      }

      const existingPath = cache.get(value as object)
      if (existingPath !== undefined) {
        out[key] = toRef(existingPath)
        continue
      }

      cache.set(value as object, valuePath)

      const childResult: unknown = Array.isArray(value) ? new Array((value as unknown[]).length) : {}
      out[key] = childResult
      queue.enqueue({ node: value as object, result: childResult, path: valuePath })
    }
  }

  return rootResult as T
}
