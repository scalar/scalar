import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'

import { convertToLocalRef } from '@/helpers/convert-to-local-ref'
import { getId, getSchemas } from '@/helpers/get-schemas'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { createPathFromSegments } from '@/helpers/json-path-utils'
import {
  type DynamicScope,
  carriesDynamicAnchor,
  containsDynamicRef,
  resolveDynamicRef,
} from '@/magic-proxy/dynamic-ref'
import type { UnknownObject } from '@/types'

const isMagicProxy = Symbol('isMagicProxy')
const magicProxyTarget = Symbol('magicProxyTarget')

const REF_VALUE = '$ref-value'
const REF_KEY = '$ref'
/** The virtual, get-only property that resolves a `$dynamicRef` against the threaded dynamic scope. */
export const DYNAMIC_REF_VALUE = '$dynamicRef-value'
const DYNAMIC_REF_KEY = '$dynamicRef'

/**
 * Grow a dynamic scope by one resource, returning a stable (interned) array.
 *
 * The same `(parentScope, resource)` pair always yields the same array identity, so the scope can be
 * used as a WeakMap key for per-scope proxy caching. Without interning, every descent would allocate a
 * fresh scope array and the scope-keyed cache could never hit, defeating referential stability.
 */
const internScope = (
  cache: WeakMap<object, WeakMap<object, DynamicScope>>,
  parentScope: DynamicScope,
  resource: UnknownObject,
): DynamicScope => {
  let byResource = cache.get(parentScope)
  if (!byResource) {
    byResource = new WeakMap()
    cache.set(parentScope, byResource)
  }
  let child = byResource.get(resource)
  if (!child) {
    child = [...parentScope, resource]
    byResource.set(resource, child)
  }
  return child
}

/**
 * Creates a "magic" proxy for a given object or array, enabling transparent access to
 * JSON Reference ($ref) values as if they were directly present on the object.
 *
 * Features:
 * - If an object contains a `$ref` property, accessing the special `$ref-value` property will resolve and return the referenced value from the root object.
 * - All nested objects and arrays are recursively wrapped in proxies, so reference resolution works at any depth.
 * - Properties starting with `__scalar_` are considered internal and are hidden by default: they return undefined on access, are excluded from enumeration, and `'in'` checks return false. This can be overridden with the `showInternal` option.
 * - Setting, deleting, and enumerating properties works as expected, including for proxied references.
 * - Ensures referential stability by caching proxies for the same target object.
 *
 * @param target - The object or array to wrap in a magic proxy
 * @param options - Optional settings (e.g., showInternal to expose internal properties)
 * @param args - Internal arguments for advanced usage (root object, proxy/cache maps, current context)
 * @returns A proxied version of the input object/array with magic $ref-value support
 *
 * @example
 * const input = {
 *   definitions: {
 *     foo: { bar: 123 }
 *   },
 *   refObj: { $ref: '#/definitions/foo' },
 *   __scalar_internal: 'hidden property'
 * }
 * const proxy = createMagicProxy(input)
 *
 * // Accessing proxy.refObj['$ref-value'] will resolve to { bar: 123 }
 * console.log(proxy.refObj['$ref-value']) // { bar: 123 }
 *
 * // Properties starting with __scalar_ are hidden
 * console.log(proxy.__scalar_internal) // undefined
 * console.log('__scalar_internal' in proxy) // false
 * console.log(Object.keys(proxy)) // ['definitions', 'refObj'] (no '__scalar_internal')
 *
 * // Setting and deleting properties works as expected
 * proxy.refObj.extra = 'hello'
 * delete proxy.refObj.extra
 */
export const createMagicProxy = <T extends Record<keyof T & symbol, unknown>, S extends UnknownObject>(
  target: T,
  options?: Partial<{ showInternal: boolean }>,
  args: {
    /**
     * The root object for resolving local JSON references.
     */
    root: S | T
    /**
     * Cache to store already created proxies for target objects to ensure referential stability.
     *
     * It is helpful when dealing with reactive frameworks like Vue,
     */
    proxyCache: WeakMap<object, T>
    /**
     * Cache to store resolved JSON references.
     */
    cache: Map<string, unknown>
    /**
     * Map of all schemas by their $id or $anchor for cross-document reference resolution.
     */
    schemas: Map<string, string>
    /**
     * The current JSON path context within the root object.
     *
     * Used to resolve $anchor references correctly.
     */
    currentContext: string
    /**
     * The JSON Schema 2020-12 dynamic scope on the current traversal path, outermost-first.
     *
     * Grown as we descend past schema resources that can hold a `$dynamicAnchor`, and used to resolve
     * the virtual `$dynamicRef-value` property. Stays empty for documents without `$dynamicRef`.
     */
    dynamicScope: DynamicScope
    /**
     * Whether the root document uses `$dynamicRef` at all.
     *
     * Computed once for the document. When false, dynamic-scope threading and the associated
     * scope-keyed caching are skipped entirely, so ordinary documents behave exactly as before.
     */
    hasDynamicRefs: boolean
    /**
     * Interns dynamic-scope arrays so the same `(parentScope, resource)` always yields the same array
     * identity. That stable identity is what makes the scope-keyed caches below work.
     */
    scopeCache: WeakMap<object, WeakMap<object, DynamicScope>>
    /**
     * Scope-keyed proxy cache used while a dynamic scope is active: one proxy per `(scope, target)`.
     *
     * `$dynamicRef` is path-dependent, so a target can bind differently under different scopes and the
     * plain `proxyCache` (one proxy per target) cannot be used. Keying by scope preserves referential
     * stability *within* a scope — which cycle detection and Vue rely on — while still returning distinct
     * proxies across scopes.
     */
    dynamicProxyCache: WeakMap<object, WeakMap<object, T>>
  } = {
    root: target,
    proxyCache: new WeakMap(),
    cache: new Map(),
    schemas: getSchemas(target),
    currentContext: '',
    dynamicScope: [],
    hasDynamicRefs: containsDynamicRef(target),
    scopeCache: new WeakMap(),
    dynamicProxyCache: new WeakMap(),
  },
): T => {
  if (!isObject(target) && !Array.isArray(target)) {
    return target
  }

  // While a dynamic scope is active, resolution is path-dependent: the same target can bind differently
  // depending on the path, so the plain one-proxy-per-target `proxyCache` cannot be used. Instead we key
  // proxies by `(scope, target)` — preserving referential stability within a scope (cycle detection and
  // Vue depend on it) while still returning distinct proxies across scopes. Ordinary documents never
  // grow a scope, so they keep using `proxyCache` unchanged.
  const dynamicScopeActive = args.dynamicScope.length > 0

  // Return the existing proxy for this (scope, target) to ensure referential stability
  const scopedProxyCache = dynamicScopeActive ? args.dynamicProxyCache.get(args.dynamicScope) : undefined
  const existingProxy = dynamicScopeActive ? scopedProxyCache?.get(target) : args.proxyCache.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // The dynamic scope handed to child proxies: grow it by this resource when it can carry a
  // `$dynamicAnchor` (only tracked for documents that actually use `$dynamicRef`). Grown scopes are
  // interned so the same `(parentScope, resource)` yields one stable array identity for the caches.
  const childScope: DynamicScope =
    args.hasDynamicRefs && carriesDynamicAnchor(target as UnknownObject) && !args.dynamicScope.includes(target)
      ? internScope(args.scopeCache, args.dynamicScope, target as UnknownObject)
      : args.dynamicScope

  const handler: ProxyHandler<T> = {
    /**
     * Proxy "get" trap for magic proxy.
     * - If accessing the special isMagicProxy symbol, return true to identify proxy.
     * - If accessing the magicProxyTarget symbol, return the original target object.
     * - Hide properties starting with __scalar_ by returning undefined.
     * - If accessing "$ref-value" and the object has a local $ref, resolve and return the referenced value as a new magic proxy.
     * - For all other properties, recursively wrap the returned value in a magic proxy (if applicable).
     */
    get(target, prop, receiver) {
      if (prop === isMagicProxy) {
        // Used to identify if an object is a magic proxy
        return true
      }

      if (prop === magicProxyTarget) {
        // Used to retrieve the original target object from the proxy
        return target
      }

      // Hide properties starting with __scalar_ - these are considered internal/private properties
      // and should not be accessible through the magic proxy interface
      if (typeof prop === 'string' && prop.startsWith('__scalar_') && !options?.showInternal) {
        return undefined
      }

      // Get the $ref value of the current target (if any)
      const ref = Reflect.get(target, REF_KEY, receiver)
      // Get the identifier ($id) of the current target for context tracking
      const id = getId(target)

      // If accessing "$dynamicRef-value" and this node carries a $dynamicRef, resolve it against the
      // dynamic scope threaded to here. Like "$ref-value" but path-dependent, so it is never cached and
      // is get-only (see the `has` trap). Unresolvable references return undefined; the schema is unchanged.
      if (prop === DYNAMIC_REF_VALUE) {
        const dynamicRef = Reflect.get(target, DYNAMIC_REF_KEY, receiver)
        if (typeof dynamicRef !== 'string') {
          return undefined
        }

        const resolved = resolveDynamicRef(dynamicRef, args.dynamicScope)
        if (resolved === undefined) {
          return undefined
        }
        if (isMagicProxyObject(resolved)) {
          return resolved
        }
        // Walk the bound schema with the scope grown by this resource (same as the `$ref-value` branch),
        // so a nested `$dynamicRef` inside a recursive template binds against the right scope.
        return createMagicProxy(resolved as T, options, {
          ...args,
          currentContext: id ?? args.currentContext,
          dynamicScope: childScope,
        })
      }

      // If accessing "$ref-value" and $ref is a local reference, resolve and return the referenced value
      if (prop === REF_VALUE && typeof ref === 'string') {
        // The shared ref cache is only safe when nothing below this hop is scope-dependent. If resolving
        // this ref enters a dynamic scope (`childScope` grew), the resolved value can bind differently per
        // path, so we skip the shared cache and rely on the scope-keyed `dynamicProxyCache` for identity.
        const refCacheable = childScope.length === 0
        if (refCacheable && args.cache.has(ref)) {
          return args.cache.get(ref)
        }

        const path = convertToLocalRef(ref, id ?? args.currentContext, args.schemas)

        if (path === undefined) {
          return undefined
        }

        // Resolve the reference and create a new magic proxy
        const resolvedValue = getValueByPath(args.root, parseJsonPointerSegments(`/${path}`))
        // Return early if the value is already a magic proxy
        if (isMagicProxyObject(resolvedValue.value)) {
          return resolvedValue.value
        }
        const proxiedValue = createMagicProxy(resolvedValue.value, options, {
          ...args,
          currentContext: resolvedValue.context,
          dynamicScope: childScope,
        })

        // Store in the shared cache only when the resolved value is scope-independent (see above)
        if (refCacheable) {
          args.cache.set(ref, proxiedValue)
        }
        return proxiedValue
      }

      // For all other properties, recursively wrap the value in a magic proxy
      const value = Reflect.get(target, prop, receiver)

      // Return early if the value is already a magic proxy
      if (isMagicProxyObject(value)) {
        return value
      }

      return createMagicProxy(value as T, options, {
        ...args,
        currentContext: id ?? args.currentContext,
        dynamicScope: childScope,
      })
    },
    /**
     * Proxy "set" trap for magic proxy.
     * Allows setting properties on the proxied object.
     * This will update the underlying target object.
     *
     * Note: it will not update if the property starts with __scalar_
     * Those will be considered private properties by the proxy
     */
    set(target, prop, newValue, receiver) {
      const ref = Reflect.get(target, REF_KEY, receiver)

      if (typeof prop === 'string' && prop.startsWith('__scalar_') && !options?.showInternal) {
        return true
      }

      if (prop === REF_VALUE && typeof ref === 'string') {
        const id = getId(target)
        const path = convertToLocalRef(ref, id ?? args.currentContext, args.schemas)

        if (path === undefined) {
          return undefined
        }

        const segments = parseJsonPointerSegments(`/${path}`)

        if (segments.length === 0) {
          return false // Can not set top level $ref-value
        }

        // Get the parent node or create it if it does not exist
        const getParentNode = () => getValueByPath(args.root, segments.slice(0, -1)).value

        if (getParentNode() === undefined) {
          createPathFromSegments(args.root, segments.slice(0, -1))

          // In this case the ref is pointing to an invalid path, so we warn the user
          console.warn(
            `Trying to set $ref-value for invalid reference: ${ref}\n\nPlease fix your input file to fix this issue.`,
          )
        }

        // Set the value on the parent node
        getParentNode()[segments.at(-1)] = newValue
        return true
      }

      return Reflect.set(target, prop, newValue, receiver)
    },
    /**
     * Proxy "deleteProperty" trap for magic proxy.
     * Allows deleting properties from the proxied object.
     * This will update the underlying target object.
     */
    deleteProperty(target, prop) {
      return Reflect.deleteProperty(target, prop)
    },
    /**
     * Proxy "has" trap for magic proxy.
     * - Pretend that "$ref-value" exists if "$ref" exists on the target.
     *   This allows expressions like `"$ref-value" in obj` to return true for objects with a $ref,
     *   even though "$ref-value" is a virtual property provided by the proxy.
     * - Hide properties starting with __scalar_ by returning false.
     * - For all other properties, defer to the default Reflect.has behavior.
     */
    has(target, prop) {
      // Hide properties starting with __scalar_
      if (typeof prop === 'string' && prop.startsWith('__scalar_') && !options?.showInternal) {
        return false
      }

      // Pretend that "$ref-value" exists if "$ref" exists
      if (prop === REF_VALUE && REF_KEY in target) {
        return true
      }
      // Note: "$dynamicRef-value" is intentionally NOT surfaced here, in `ownKeys`, or in
      // `getOwnPropertyDescriptor`. It is a get-only virtual accessor: resolution is path-dependent, so
      // it must not leak into enumeration, spreads, coercion or serialization (which would embed a
      // resolved schema at the wrong scope). Consumers read it explicitly after an `isDynamicRef` check.
      return Reflect.has(target, prop)
    },
    /**
     * Proxy "ownKeys" trap for magic proxy.
     * - Returns the list of own property keys for the proxied object.
     * - If the object has a "$ref" property, ensures that "$ref-value" is also included in the keys,
     *   even though "$ref-value" is a virtual property provided by the proxy.
     *   This allows Object.keys, Reflect.ownKeys, etc. to include "$ref-value" for objects with $ref.
     * - Filters out properties starting with __scalar_.
     */
    ownKeys(target) {
      const keys = Reflect.ownKeys(target)

      // Filter out properties starting with __scalar_
      const filteredKeys = keys.filter(
        (key) => typeof key !== 'string' || !(key.startsWith('__scalar_') && !options?.showInternal),
      )

      if (REF_KEY in target && !filteredKeys.includes(REF_VALUE)) {
        filteredKeys.push(REF_VALUE)
      }
      return filteredKeys
    },

    /**
     * Proxy "getOwnPropertyDescriptor" trap for magic proxy.
     * - For the virtual "$ref-value" property, returns a descriptor that makes it appear as a regular property.
     * - Hide properties starting with __scalar_ by returning undefined.
     * - For all other properties, delegates to the default Reflect.getOwnPropertyDescriptor behavior.
     * - This ensures that Object.getOwnPropertyDescriptor and similar methods work correctly with the virtual property.
     */
    getOwnPropertyDescriptor(target, prop) {
      // Hide properties starting with __scalar_
      if (typeof prop === 'string' && prop.startsWith('__scalar_') && !options?.showInternal) {
        return undefined
      }

      const ref = Reflect.get(target, REF_KEY)

      if (prop === REF_VALUE && typeof ref === 'string') {
        return {
          configurable: true,
          enumerable: true,
          value: undefined,
          writable: false,
        }
      }

      // Otherwise, delegate to the default behavior
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  }

  const proxied = new Proxy<T>(target, handler)
  // Cache the proxy for reuse. Under an active dynamic scope, key it by `(scope, target)` so the same
  // target reached again on the same path returns the same proxy (referential stability that cycle
  // detection and Vue rely on) while a different path — a different scope — gets its own proxy.
  if (dynamicScopeActive) {
    let scoped = args.dynamicProxyCache.get(args.dynamicScope)
    if (!scoped) {
      scoped = new WeakMap()
      args.dynamicProxyCache.set(args.dynamicScope, scoped)
    }
    scoped.set(target, proxied)
  } else {
    args.proxyCache.set(target, proxied)
  }
  return proxied
}

const isMagicProxyObject = (obj: unknown): boolean => {
  return typeof obj === 'object' && obj !== null && (obj as { [isMagicProxy]: boolean })[isMagicProxy] === true
}

/**
 * Gets the raw (non-proxied) version of an object created by createMagicProxy.
 * This is useful when you need to access the original object without the magic proxy wrapper.
 *
 * @param obj - The magic proxy object to get the raw version of
 * @returns The raw version of the object
 * @example
 * const proxy = createMagicProxy({ foo: { $ref: '#/bar' } })
 * const raw = getRaw(proxy) // { foo: { $ref: '#/bar' } }
 */
export function getRaw<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if ((obj as T & { [isMagicProxy]: boolean | undefined })[isMagicProxy]) {
    return (obj as T & { [magicProxyTarget]: T })[magicProxyTarget]
  }

  return obj
}
