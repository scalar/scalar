import { isObject } from '@scalar/helpers/object/is-object'

const isDetectChangesProxy = Symbol('isDetectChangesProxy')
const detectChangesProxyTarget = Symbol('detectChangesProxyTarget')

type OnBeforeChangeHook = (path: string[], value?: unknown) => void
type OnAfterChangeHook = (path: string[], value?: unknown) => void

type Options = {
  hooks: Partial<{
    onBeforeChange: OnBeforeChangeHook
    onAfterChange: OnAfterChangeHook
  }>
}

/**
 * One link of the path a proxy sits at, pointing at the node above it.
 *
 * Reads outnumber writes by orders of magnitude on a rendered document, so a proxy keeps this link
 * rather than a `string[]`: the array is built only when a `set` or `deleteProperty` hook is about to
 * receive it. A node keeps the link it was first reached through, which is also the path the previous
 * implementation froze into the proxy it cached.
 */
type PathLink = {
  parent: PathLink | undefined
  key: string
}

/** Build the `string[]` a hook expects, from the chain of links above the property being written. */
const materializePath = (parent: PathLink | undefined, prop: string): string[] => {
  let depth = 1
  for (let link = parent; link !== undefined; link = link.parent) {
    depth++
  }

  const path = new Array<string>(depth)
  path[--depth] = prop
  for (let link = parent; link !== undefined; link = link.parent) {
    path[--depth] = link.key
  }

  return path
}

/** Turn the caller-supplied starting path into the link chain the proxies carry. */
const toPathLink = (path: string[]): PathLink | undefined => {
  let link: PathLink | undefined = undefined
  for (const key of path) {
    link = { parent: link, key }
  }
  return link
}

const createProxy = <T>(
  target: T,
  options: Options | undefined,
  proxyCache: WeakMap<object, unknown>,
  pathLink: PathLink | undefined,
): T => {
  // Only wrap objects or arrays
  if (!isObject(target) && !Array.isArray(target)) {
    return target
  }

  // Return cached proxy if already created for this target
  const cached = proxyCache.get(target)
  if (cached !== undefined) {
    return cached as T
  }

  const proxy = new Proxy(target as T & object, {
    get(target, prop, receiver) {
      // Allow identifying if an object is a detect changes proxy
      if (prop === isDetectChangesProxy) {
        return true
      }
      // Allow access to the original target
      if (prop === detectChangesProxyTarget) {
        return target
      }

      const value = Reflect.get(target, prop, receiver)

      // Primitives and functions are handed back untouched, which is the common case on a read.
      if (value === null || typeof value !== 'object') {
        return value
      }

      // A value wrapped earlier keeps its proxy, so nothing below this point runs for a repeat read.
      const cachedChild = proxyCache.get(value)
      if (cachedChild !== undefined) {
        return cachedChild
      }

      if (isDetectChangesProxyObject(value)) {
        return value
      }

      // Recursively wrap property values in the detect changes proxy
      return createProxy(value, options, proxyCache, { parent: pathLink, key: String(prop) })
    },
    set(target, prop, value, receiver) {
      const onBeforeChange = options?.hooks?.onBeforeChange
      const onAfterChange = options?.hooks?.onAfterChange

      // Both hooks receive the same array, because `client.ts` mutates it in `onAfterChange`.
      const path = onBeforeChange || onAfterChange ? materializePath(pathLink, String(prop)) : undefined

      // Call before-change hook if provided
      if (path) {
        onBeforeChange?.(path, value)
      }
      const result = Reflect.set(target, prop, value, receiver)
      // Call after-change hook if provided
      if (path) {
        onAfterChange?.(path, value)
      }
      return result
    },
    deleteProperty(target, prop) {
      const onBeforeChange = options?.hooks?.onBeforeChange
      const onAfterChange = options?.hooks?.onAfterChange
      const path = onBeforeChange || onAfterChange ? materializePath(pathLink, String(prop)) : undefined

      if (path) {
        onBeforeChange?.(path)
      }
      const result = Reflect.deleteProperty(target, prop)
      if (path) {
        onAfterChange?.(path)
      }
      return result
    },
  })

  // Cache the proxy for this target
  proxyCache.set(target, proxy)
  return proxy as T
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
  options?: Options,
  args: {
    /** Cache for storing proxies */
    proxyCache: WeakMap<object, unknown>
    /** Path for the target */
    path: string[]
  } = {
    proxyCache: new WeakMap<object, unknown>(),
    path: [],
  },
): T => createProxy(target, options, args.proxyCache, toPathLink(args.path))

export const isDetectChangesProxyObject = (obj: unknown): boolean => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as { [isDetectChangesProxy]: boolean })[isDetectChangesProxy] === true
  )
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
