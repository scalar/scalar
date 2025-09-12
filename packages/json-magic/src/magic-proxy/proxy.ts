import { isLocalRef } from '@/bundle/bundle'
import type { UnknownObject } from '@/types'
import { getSegmentsFromPath } from '@/utils/get-segments-from-path'
import { isObject } from '@/utils/is-object'
import { createPathFromSegments, getValueByPath, parseJsonPointer } from '@/utils/json-path-utils'

const isMagicProxy = Symbol('isMagicProxy')
const magicProxyTarget = Symbol('magicProxyTarget')

const REF_VALUE = '$ref-value'
const REF_KEY = '$ref'

/**
 * Creates a "magic" proxy for a given object or array, enabling transparent access to
 * JSON Reference ($ref) values as if they were directly present on the object.
 *
 * - If an object contains a `$ref` property, accessing the special `$ref-value` property
 *   will resolve and return the referenced value from the root object.
 * - All nested objects and arrays are recursively wrapped in proxies, so reference resolution
 *   works at any depth.
 * - Properties starting with an underscore (_) are hidden and will not be accessible through
 *   the proxy (returns undefined on access, false on 'in' checks, excluded from enumeration).
 * - Setting, deleting, and enumerating properties works as expected, including for proxied references.
 *
 * @param target - The object or array to wrap in a magic proxy
 * @param root - The root object for resolving local JSON references (defaults to target)
 * @returns A proxied version of the input object/array with magic $ref-value support
 *
 * @example
 * const input = {
 *   definitions: {
 *     foo: { bar: 123 }
 *   },
 *   refObj: { $ref: '#/definitions/foo' },
 *   _internal: 'hidden property'
 * }
 * const proxy = createMagicProxy(input)
 *
 * // Accessing proxy.refObj['$ref-value'] will resolve to { bar: 123 }
 * console.log(proxy.refObj['$ref-value']) // { bar: 123 }
 *
 * // Properties starting with underscore are hidden
 * console.log(proxy._internal) // undefined
 * console.log('_internal' in proxy) // false
 * console.log(Object.keys(proxy)) // ['definitions', 'refObj'] (no '_internal')
 *
 * // Setting and deleting properties works as expected
 * proxy.refObj.extra = 'hello'
 * delete proxy.refObj.extra
 */
export const createMagicProxy = <T extends Record<keyof T & symbol, unknown>, S extends UnknownObject>(
  target: T,
  options?: { showInternal?: boolean },
  root: S | T = target,
  cache = new Map<string, unknown>(),
  proxyCache = new WeakMap<object, T>(),
) => {
  if (!isObject(target) && !Array.isArray(target)) {
    return target
  }

  // Return existing proxy for the same target to ensure referential stability
  if (proxyCache.has(target)) {
    return proxyCache.get(target)
  }

  const handler: ProxyHandler<T> = {
    /**
     * Proxy "get" trap for magic proxy.
     * - If accessing the special isMagicProxy symbol, return true to identify proxy.
     * - If accessing the magicProxyTarget symbol, return the original target object.
     * - Hide properties starting with underscore by returning undefined.
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

      const ref = Reflect.get(target, REF_KEY, receiver)

      // Hide properties starting with underscore - these are considered internal/private properties
      // and should not be accessible through the magic proxy interface
      if (typeof prop === 'string' && prop.startsWith('_') && !options?.showInternal) {
        return undefined
      }

      // If accessing "$ref-value" and $ref is a local reference, resolve and return the referenced value
      if (prop === REF_VALUE && typeof ref === 'string' && isLocalRef(ref)) {
        // Check cache first for performance optimization
        if (cache.has(ref)) {
          return cache.get(ref)
        }

        // Resolve the reference and create a new magic proxy
        const resolvedValue = getValueByPath(root, parseJsonPointer(ref))
        const proxiedValue = createMagicProxy(resolvedValue, options, root, cache)

        // Store in cache for future lookups
        cache.set(ref, proxiedValue)
        return proxiedValue
      }

      // For all other properties, recursively wrap the value in a magic proxy
      const value = Reflect.get(target, prop, receiver)
      return createMagicProxy(value as T, options, root, cache, proxyCache)
    },
    /**
     * Proxy "set" trap for magic proxy.
     * Allows setting properties on the proxied object.
     * This will update the underlying target object.
     *
     * Note: it will not update if the property starts with an underscore (_)
     * Those will be considered private properties by the proxy
     */
    set(target, prop, newValue, receiver) {
      const ref = Reflect.get(target, REF_KEY, receiver)

      if (typeof prop === 'string' && prop.startsWith('_') && !options?.showInternal) {
        return true
      }

      if (prop === REF_VALUE && typeof ref === 'string' && isLocalRef(ref)) {
        const segments = getSegmentsFromPath(ref)

        if (segments.length === 0) {
          return false // Can not set top level $ref-value
        }

        // Get the parent node or create it if it does not exist
        const getParentNode = () => getValueByPath(root, segments.slice(0, -1))

        if (getParentNode() === undefined) {
          createPathFromSegments(root, segments.slice(0, -1))

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
     * - Hide properties starting with underscore by returning false.
     * - For all other properties, defer to the default Reflect.has behavior.
     */
    has(target, prop) {
      // Hide properties starting with underscore
      if (typeof prop === 'string' && prop.startsWith('_') && !options?.showInternal) {
        return false
      }

      // Pretend that "$ref-value" exists if "$ref" exists
      if (prop === REF_VALUE && REF_KEY in target) {
        return true
      }
      return Reflect.has(target, prop)
    },
    /**
     * Proxy "ownKeys" trap for magic proxy.
     * - Returns the list of own property keys for the proxied object.
     * - If the object has a "$ref" property, ensures that "$ref-value" is also included in the keys,
     *   even though "$ref-value" is a virtual property provided by the proxy.
     *   This allows Object.keys, Reflect.ownKeys, etc. to include "$ref-value" for objects with $ref.
     * - Filters out properties starting with underscore.
     */
    ownKeys(target) {
      const keys = Reflect.ownKeys(target)

      // Filter out properties starting with underscore
      const filteredKeys = keys.filter(
        (key) => typeof key !== 'string' || !(key.startsWith('_') && !options?.showInternal),
      )

      if (REF_KEY in target && !filteredKeys.includes(REF_VALUE)) {
        filteredKeys.push(REF_VALUE)
      }
      return filteredKeys
    },

    /**
     * Proxy "getOwnPropertyDescriptor" trap for magic proxy.
     * - For the virtual "$ref-value" property, returns a descriptor that makes it appear as a regular property.
     * - Hide properties starting with underscore by returning undefined.
     * - For all other properties, delegates to the default Reflect.getOwnPropertyDescriptor behavior.
     * - This ensures that Object.getOwnPropertyDescriptor and similar methods work correctly with the virtual property.
     */
    getOwnPropertyDescriptor(target, prop) {
      // Hide properties starting with underscore
      if (typeof prop === 'string' && prop.startsWith('_') && !options?.showInternal) {
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
  proxyCache.set(target, proxied)
  return proxied
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
