import { isLocalRef } from '@/bundle/bundle'
import type { UnknownObject } from '@/types'
import { getSegmentsFromPath } from '@/utils/get-segments-from-path'
import { isObject } from '@/utils/is-object'
import { getValueByPath, parseJsonPointer } from '@/utils/json-path-utils'

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
 *   refObj: { $ref: '#/definitions/foo' }
 * }
 * const proxy = createMagicProxy(input)
 *
 * // Accessing proxy.refObj['$ref-value'] will resolve to { bar: 123 }
 * console.log(proxy.refObj['$ref-value']) // { bar: 123 }
 *
 * // Setting and deleting properties works as expected
 * proxy.refObj.extra = 'hello'
 * delete proxy.refObj.extra
 */
export const createMagicProxy = <T extends Record<keyof T & symbol, unknown>, S extends UnknownObject>(
  target: T,
  root: S | T = target,
  cache = new Map<string, unknown>(),
) => {
  if (!isObject(target) && !Array.isArray(target)) {
    return target
  }

  const handler: ProxyHandler<T> = {
    /**
     * Proxy "get" trap for magic proxy.
     * - If accessing the special isMagicProxy symbol, return true to identify proxy.
     * - If accessing the magicProxyTarget symbol, return the original target object.
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

      // If accessing "$ref-value" and $ref is a local reference, resolve and return the referenced value
      if (prop === REF_VALUE && typeof ref === 'string' && isLocalRef(ref)) {
        // Check cache first for performance optimization
        if (cache.has(ref)) {
          return cache.get(ref)
        }

        // Resolve the reference and create a new magic proxy
        const resolvedValue = getValueByPath(root, parseJsonPointer(ref))
        const proxiedValue = createMagicProxy(resolvedValue, root, cache)

        // Store in cache for future lookups
        cache.set(ref, proxiedValue)
        return proxiedValue
      }

      // For all other properties, recursively wrap the value in a magic proxy
      const value = Reflect.get(target, prop, receiver)
      return createMagicProxy(value, root, cache)
    },
    /**
     * Proxy "set" trap for magic proxy.
     * Allows setting properties on the proxied object.
     * This will update the underlying target object.
     */
    set(target, prop, newValue, receiver) {
      const ref = Reflect.get(target, REF_KEY, receiver)

      if (prop === REF_VALUE && typeof ref === 'string' && isLocalRef(ref)) {
        const segments = getSegmentsFromPath(ref)

        if (segments.length === 0) {
          return false // Can not set top level $ref-value
        }

        const parentNode = getValueByPath(root, segments.slice(0, -1))

        // TODO: Maybe we create the path if it does not exist?
        // TODO: This can allow for invalid references to not throw errors
        if (!parentNode || (!isObject(parentNode) && !Array.isArray(parentNode))) {
          return false // Parent node does not exist, cannot set $ref-value
        }
        parentNode[segments.at(-1)] = newValue
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
     * - For all other properties, defer to the default Reflect.has behavior.
     */
    has(target, prop) {
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
     */
    ownKeys(target) {
      const keys = Reflect.ownKeys(target)
      if (REF_KEY in target && !keys.includes(REF_VALUE)) {
        keys.push(REF_VALUE)
      }
      return keys
    },

    /**
     * Proxy "getOwnPropertyDescriptor" trap for magic proxy.
     * - For the virtual "$ref-value" property, returns a descriptor that makes it appear as a regular property.
     * - For all other properties, delegates to the default Reflect.getOwnPropertyDescriptor behavior.
     * - This ensures that Object.getOwnPropertyDescriptor and similar methods work correctly with the virtual property.
     */
    getOwnPropertyDescriptor(target, prop) {
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

  return new Proxy<T>(target, handler)
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
