import { isObject } from '@/helpers/general'

const isDetectChangesProxy = Symbol('isDetectChangesProxy')
const detectChangesProxyTarget = Symbol('detectChangesProxyTarget')

const isPropsVue = (prop: string | Symbol) => {
  return (
    typeof prop === 'symbol' ||
    prop === '__v_isReactive' ||
    prop === '__v_isReadonly' ||
    prop === '__v_raw' ||
    prop === '__v_skip'
  )
}

/**
 * createDetectChangesProxy - Creates a proxy for an object or array that detects and triggers hooks on changes.
 *
 * This proxy enables detection of set operations, triggering optional hooks (onBeforeChange, onAfterChange) with the path and value changed.
 * The proxy can be applied recursively to all nested objects/arrays, and caches proxies to prevent creating multiple proxies for the same object.
 *
 * Example usage:
 *
 * const obj = { foo: 1, bar: { baz: 2 } };
 * const proxy = createDetectChangesProxy(obj, {
 *   hooks: {
 *     onBeforeChange: (path, value) => console.log('Before', path, value),
 *     onAfterChange: (path, value) => console.log('After', path, value),
 *   }
 * });
 * proxy.foo = 42; // Console: Before ['foo'] '42', After ['foo'] '42'
 * proxy.bar.baz = 99; // Console: Before ['bar', 'baz'] '99', After ['bar', 'baz'] '99'
 *
 * @param target The target object or array to wrap in a proxy
 * @param options Optional: hooks for change detection
 * @param args Internal: proxy cache and current property path (used for recursion)
 * @returns The proxied object/array with change detection capabilities
 */
export const createDetectChangesProxy = <T>(
  target: T,
  options?: {
    hooks: Partial<{
      onBeforeChange: (path: string[], value: unknown) => void
      onAfterChange: (path: string[], value: unknown) => void
    }>
  },
  args: {
    /** Cache for storing proxies */
    proxyCache: WeakMap<object, unknown>
    /** Path for the target */
    path: string[]
  } = {
    proxyCache: new WeakMap<object, unknown>(),
    path: [],
  },
): T => {
  // Only wrap objects or arrays
  if (!isObject(target) && !Array.isArray(target)) {
    return target
  }

  // Return cached proxy if already created for this target
  if (args.proxyCache.has(target)) {
    return args.proxyCache.get(target)! as T
  }

  const proxy = new Proxy(target, {
    get(target, prop, receiver) {
      // Allow identifying if an object is a detect changes proxy
      if (prop === isDetectChangesProxy) {
        return true
      }
      // Allow access to the original target
      if (prop === detectChangesProxyTarget) {
        return target
      }

      // Recursively wrap property values in the detect changes proxy
      const value = Reflect.get(target, prop, receiver)

      if (isPropsVue(prop)) {
        return value
      }

      return createDetectChangesProxy(value, options, { ...args, path: [...args.path, String(prop)] })
    },
    set(target, prop, value, receiver) {
      const path = [...args.path, String(prop)]
      // Call before-change hook if provided
      options?.hooks?.onBeforeChange?.(path, value)
      const result = Reflect.set(target, prop, value, receiver)
      // Call after-change hook if provided
      options?.hooks?.onAfterChange?.(path, value)
      return result
    },
  })

  // Cache the proxy for this target
  args.proxyCache.set(target, proxy)
  return proxy
}

/**
 * Returns the raw/original (non-proxy) object if the passed object is a detect-changes proxy.
 * If the object is not a proxy, it returns the same object.
 *
 * @example
 * const proxy = createDetectChangesProxy({ a: 1 });
 * const raw = unpackDetectChangesProxy(proxy); // Gets the original object { a: 1 }
 * const notProxy = { b: 2 };
 * const stillRaw = unpackDetectChangesProxy(notProxy); // Returns { b: 2 }, unchanged
 */
export const unpackDetectChangesProxy = <T>(obj: T): T => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  // If object is a detect-changes proxy, return its underlying target
  if ((obj as T & { [isDetectChangesProxy]: boolean | undefined })[isDetectChangesProxy]) {
    return (obj as T & { [detectChangesProxyTarget]: T })[detectChangesProxyTarget]
  }

  return obj
}
