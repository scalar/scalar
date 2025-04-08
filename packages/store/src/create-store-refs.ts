import { isReactive, reactive, toRaw } from 'vue'

export function createStore(definition: Record<string, unknown>) {
  // Make the original document reactive so Vue can track it
  const originalDoc = reactive(definition)

  // Cache to store proxies for already wrapped objects (to handle reuse and circular refs)
  const proxyCache = new WeakMap()

  // Helper: parse a JSON Pointer string (after "#/") into an array of keys
  function parseRef(refString: string) {
    // Remove leading "#/"
    const path = refString.replace(/^#\//, '').split('/')
    // Decode any JSON Pointer escape sequences
    return path.map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
  }

  // Helper: get a nested value from the original document by an array path
  function getByPath(obj: Record<string, unknown>, pathArray: string[]): Record<string, unknown> | undefined {
    return pathArray.reduce<unknown>(
      (o: unknown, key) => (o && typeof o === 'object' && key in o ? (o as Record<string, unknown>)[key] : undefined),
      obj,
    ) as Record<string, unknown> | undefined
  }

  // Recursive function to create a Proxy for a given object or array
  function createDeepProxy(obj: Record<string, unknown>) {
    if (obj === null || typeof obj !== 'object') {
      return obj // Primitive, no proxy needed
    }

    // Get the raw object if it's reactive
    const targetObj = isReactive(obj) ? toRaw(obj) : obj
    if (proxyCache.has(targetObj)) {
      return proxyCache.get(targetObj) // 🔥 return cached Proxy early!
    }

    const handler = {
      get(target: Record<string, unknown>, prop: string, receiver: Record<string, unknown>) {
        if (prop === '__isProxy') {
          return true
        }

        const value = Reflect.get(target, prop, receiver)

        if (value && typeof value === 'object') {
          if ('$ref' in value) {
            const refPath = parseRef(value.$ref as string)
            const resolved = getByPath(originalDoc, refPath)

            if (resolved) {
              // recursive, safe because of cache
              return createDeepProxy(resolved)
            }
          }

          // recursive, safe because of cache
          return createDeepProxy(value)
        }

        return value
      },
      set(target: Record<string, unknown>, prop: string, newVal: unknown, receiver: Record<string, unknown>) {
        // Get raw target if it's reactive
        const rawTarget = isReactive(target) ? toRaw(target) : target

        const current = rawTarget[prop]
        if (current && typeof current === 'object' && '$ref' in current && typeof current.$ref === 'string') {
          const refPath = parseRef(current.$ref)
          const targetObj = getByPath(originalDoc, refPath.slice(0, -1))
          const lastKey = refPath[refPath.length - 1]

          if (targetObj && lastKey) {
            targetObj[lastKey] = newVal
          }
        } else {
          // Set on the raw target
          Reflect.set(rawTarget, prop, newVal, receiver)
        }
        return true
      },
      has(target: Record<string, unknown>, key: string) {
        if (typeof key === 'string' && key !== '$ref' && typeof target.$ref === 'string') {
          const refPath = parseRef(target['$ref'])
          const resolved = getByPath(originalDoc, refPath)
          return resolved ? key in resolved : false
        }

        return key in target
      },
      ownKeys(target: Record<string, unknown>) {
        if ('$ref' in target && typeof target.$ref === 'string') {
          const refPath = parseRef(target['$ref'])
          const resolved = getByPath(originalDoc, refPath)
          return resolved ? Reflect.ownKeys(resolved) : []
        }
        return Reflect.ownKeys(target)
      },
      getOwnPropertyDescriptor(target: Record<string, unknown>, key: string) {
        if ('$ref' in target && key !== '$ref' && typeof target.$ref === 'string') {
          const refPath = parseRef(target['$ref'])
          const resolved = getByPath(originalDoc, refPath)
          if (resolved) {
            return Object.getOwnPropertyDescriptor(resolved, key)
          }
        }
        return Object.getOwnPropertyDescriptor(target, key)
      },
    }

    const proxy = new Proxy(obj, handler)

    // cache Proxy immediately after creating it
    proxyCache.set(targetObj, proxy)

    return proxy
  }

  // Create the top-level proxy for the entire document
  const documentProxy = createDeepProxy(originalDoc)

  return {
    document: documentProxy,
    // Export function to get the raw document with $refs intact
    export() {
      // toRaw removes Vue's reactivity proxies, giving us the original plain object
      return toRaw(originalDoc)
    },
  }
}
