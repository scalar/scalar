/** Whether a value is a plain object (an object literal, parsed JSON or YAML) rather than a class instance. */
const isPlainObject = (value: object): value is Record<string, unknown> => {
  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

/**
 * Copy the JSON-shaped part of a value: arrays and plain objects are copied, everything else is
 * kept as is.
 *
 * `seen` maps each source object to its copy, so a shared object stays shared and a cycle stays a
 * cycle, the way they were in the source.
 */
const copy = (value: unknown, seen: Map<object, unknown>): unknown => {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  const existing = seen.get(value)
  if (existing !== undefined) {
    return existing
  }

  if (Array.isArray(value)) {
    const result: unknown[] = new Array(value.length)
    seen.set(value, result)
    // `forEach` skips holes, so a sparse array stays sparse.
    value.forEach((item, index) => {
      result[index] = copy(item, seen)
    })

    return result
  }

  // A `Date`, a `Map` or any other instance is not something bundling walks into, so it is shared
  // with the source rather than rebuilt without its prototype.
  if (!isPlainObject(value)) {
    return value
  }

  const result: Record<string, unknown> = {}
  seen.set(value, result)

  for (const [key, item] of Object.entries(value)) {
    // Defined rather than assigned, so a `__proto__` key in parsed JSON stays an ordinary key
    // instead of replacing the copy's prototype.
    Object.defineProperty(result, key, {
      value: copy(item, seen),
      enumerable: true,
      writable: true,
      configurable: true,
    })
  }

  return result
}

/**
 * Deep copy an API description passed as an object, so processing it never edits the caller's object.
 *
 * Bundling writes into the document it is handed — it records external documents under `x-ext` and
 * removes `x-ext-urls` — and that must not leak back into an object the caller still holds.
 *
 * Not `structuredClone`: it throws on values a caller can reasonably pass, such as a `Proxy` (a
 * reactive or lazily resolved document) or a function somewhere in the tree. Copying only arrays and
 * plain objects handles those, keeps shared and circular references intact, and leaves anything
 * else in the tree shared with the caller.
 */
export const cloneDocument = <T extends object>(document: T): T => copy(document, new Map()) as T
