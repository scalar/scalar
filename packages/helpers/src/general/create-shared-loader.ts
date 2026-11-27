/** Loads values by key once, for every caller at once. */
export type SharedLoader<Key, Value> = {
  /**
   * Loads the value for a key. A cached value resolves right away, and concurrent calls for the same
   * key share one load. A failed load rejects every caller waiting on it and is then forgotten, so the
   * next call tries again.
   */
  load: (key: Key) => Promise<Value>
  /** The value for a key once it has loaded, or `undefined` before that. */
  get: (key: Key) => Value | undefined
}

/**
 * Wraps an async loader, such as a dynamic `import()`, so each key loads once and is then cached.
 *
 * Lazy chunks are requested by many callers at once (every code block of a page asks for its grammar
 * while rendering), so concurrent calls share the request in flight. Failures are not cached: a chunk
 * request that lost the network would otherwise replay its rejection forever, so the next call starts
 * a fresh load instead.
 *
 * @param load - Loads the value for a key. It may also throw synchronously; that counts as a failed load.
 * @param cache - Where loaded values are kept. Pass your own map to read it elsewhere, for example a
 * reactive map that re-renders whatever read a missing key.
 *
 * @example
 * ```ts
 * const plugins = createSharedLoader((id: string) => import(`./plugins/${id}.js`))
 *
 * await Promise.all([plugins.load('curl'), plugins.load('curl')]) // imports once
 * plugins.get('curl') // the loaded module
 * ```
 */
export const createSharedLoader = <Key, Value>(
  load: (key: Key) => Promise<Value>,
  cache: Map<Key, Value> = new Map(),
): SharedLoader<Key, Value> => {
  const pending = new Map<Key, Promise<Value>>()

  return {
    load: (key) => {
      if (cache.has(key)) {
        return Promise.resolve(cache.get(key) as Value)
      }

      const inFlight = pending.get(key)
      if (inFlight) {
        return inFlight
      }

      // The executor runs the loader right away, so the request starts now, and a loader that throws
      // instead of rejecting fails the same way
      const request = new Promise<Value>((resolve) => resolve(load(key))).then(
        (value) => {
          cache.set(key, value)
          pending.delete(key)
          return value
        },
        (error: unknown) => {
          pending.delete(key)
          throw error
        },
      )
      pending.set(key, request)

      return request
    },
    get: (key) => cache.get(key),
  }
}
