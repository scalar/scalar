import { isReactive, toRaw } from 'vue'
import { getValueByPath, parseJsonPointer } from './json-path-utils'
import { isLocalRef, isObject } from './general'
import type { UnknownObject } from './general'

export const TARGET_SYMBOL = Symbol('target')

/**
 * Creates a proxy handler that automatically resolves JSON references ($ref) in an object.
 * The handler intercepts property access, assignment, and property enumeration to automatically
 * resolve any $ref references to their target values in the source document.
 *
 * @param sourceDocument - The source document containing the reference targets
 * @param resolvedProxyCache - Optional cache to store resolved proxies and prevent duplicate proxies
 * @returns A proxy handler that automatically resolves $ref references
 */
function createProxyHandler(
  sourceDocument: UnknownObject,
  resolvedProxyCache?: WeakMap<object, UnknownObject>,
): ProxyHandler<UnknownObject> {
  return {
    get(target, property, receiver) {
      if (property === TARGET_SYMBOL) {
        return target
      }

      if (property === '__isProxy') {
        return true
      }

      const value = Reflect.get(target, property, receiver)

      /**
       * Recursively resolves nested references in an object.
       * If the value is not an object, returns it as is.
       * If the value has a $ref property:
       *   - For local references: resolves the reference and continues resolving nested refs
       *   - For all other objects: creates a proxy for lazy resolution
       */
      const deepResolveNestedRefs = (value: unknown, originalRef?: string) => {
        if (!isObject(value)) {
          return value
        }

        if ('$ref' in value) {
          const ref = value.$ref as string

          if (isLocalRef(ref)) {
            const referencePath = parseJsonPointer(ref)
            const resolvedValue = getValueByPath(sourceDocument, referencePath)

            // preserve the first $ref to maintain the original reference
            return deepResolveNestedRefs(resolvedValue, originalRef ?? ref)
          }
        }

        if (originalRef) {
          return createMagicProxy({ ...value, 'x-original-ref': originalRef }, sourceDocument, resolvedProxyCache)
        }

        return createMagicProxy(value, sourceDocument, resolvedProxyCache)
      }

      return deepResolveNestedRefs(value)
    },

    set(target: UnknownObject, property: string, newValue: unknown, receiver: UnknownObject) {
      const rawTarget = isReactive(target) ? toRaw(target) : target
      const currentValue = rawTarget[property]

      if (
        isObject(currentValue) &&
        '$ref' in currentValue &&
        typeof currentValue.$ref === 'string' &&
        isLocalRef(currentValue.$ref)
      ) {
        const referencePath = parseJsonPointer(currentValue.$ref)
        const targetObject = getValueByPath(sourceDocument, referencePath.slice(0, -1)) as UnknownObject
        const lastPathSegment = referencePath[referencePath.length - 1]

        if (targetObject && lastPathSegment) {
          targetObject[lastPathSegment] = newValue
        }
      } else {
        Reflect.set(rawTarget, property, newValue, receiver)
      }
      return true
    },

    has(target: UnknownObject, key: string) {
      if (typeof key === 'string' && key !== '$ref' && typeof target.$ref === 'string' && isLocalRef(target.$ref)) {
        const referencePath = parseJsonPointer(target['$ref'])
        const resolvedValue = getValueByPath(sourceDocument, referencePath) as UnknownObject

        return resolvedValue ? key in resolvedValue : false
      }

      return key in target
    },

    ownKeys(target: UnknownObject) {
      if ('$ref' in target && typeof target.$ref === 'string' && isLocalRef(target.$ref)) {
        const referencePath = parseJsonPointer(target['$ref'])
        const resolvedValue = getValueByPath(sourceDocument, referencePath)

        return resolvedValue ? Reflect.ownKeys(resolvedValue) : []
      }

      return Reflect.ownKeys(target)
    },

    getOwnPropertyDescriptor(target: UnknownObject, key: string) {
      if ('$ref' in target && key !== '$ref' && typeof target.$ref === 'string' && isLocalRef(target.$ref)) {
        const referencePath = parseJsonPointer(target['$ref'])
        const resolvedValue = getValueByPath(sourceDocument, referencePath)

        if (resolvedValue) {
          return Object.getOwnPropertyDescriptor(resolvedValue, key)
        }
      }

      return Object.getOwnPropertyDescriptor(target, key)
    },
  }
}

/**
 * Creates a proxy that automatically resolves JSON references ($ref) in an object.
 * The proxy intercepts property access and automatically resolves any $ref references
 * to their target values in the source document.
 *
 * @param targetObject - The object to create a proxy for
 * @param sourceDocument - The source document containing the reference targets (defaults to targetObject)
 * @param resolvedProxyCache - Optional cache to store resolved proxies and prevent duplicate proxies
 * @returns A proxy that automatically resolves $ref references
 *
 * @example
 * // Basic usage with local references
 * const doc = {
 *   components: {
 *     schemas: {
 *       User: { type: 'object', properties: { name: { type: 'string' } } }
 *     }
 *   },
 *   paths: {
 *     '/users': {
 *       get: {
 *         responses: {
 *           200: {
 *             content: {
 *               'application/json': {
 *                 schema: { $ref: '#/components/schemas/User' }
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * const proxy = createMagicProxy(doc)
 * // Accessing the schema will automatically resolve the $ref
 * console.log(proxy.paths['/users'].get.responses[200].content['application/json'].schema)
 * // Output: { type: 'object', properties: { name: { type: 'string' } } }
 *
 * @example
 * // Using with a cache to prevent duplicate proxies
 * const cache = new WeakMap()
 * const proxy1 = createMagicProxy(doc, doc, cache)
 * const proxy2 = createMagicProxy(doc, doc, cache)
 * // proxy1 and proxy2 are the same instance due to caching
 * console.log(proxy1 === proxy2) // true
 */
export function createMagicProxy<T extends UnknownObject>(
  targetObject: T,
  sourceDocument: T = targetObject,
  resolvedProxyCache?: WeakMap<object, T>,
): T {
  if (!isObject(targetObject)) {
    return targetObject
  }

  const rawTarget = isReactive(targetObject) ? toRaw(targetObject) : targetObject

  // check for cached results
  if (resolvedProxyCache?.has(rawTarget)) {
    const cachedValue = resolvedProxyCache.get(rawTarget)

    if (cachedValue) {
      return cachedValue
    }
  }

  // Create a handler with the correct context
  const handler = createProxyHandler(sourceDocument, resolvedProxyCache)
  const proxy = new Proxy<T>(rawTarget, handler)

  if (resolvedProxyCache) {
    resolvedProxyCache.set(rawTarget, proxy)
  }

  return proxy
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
export function getRaw(obj: UnknownObject) {
  return (obj as { [TARGET_SYMBOL]: UnknownObject })[TARGET_SYMBOL]
}
