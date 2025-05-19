import { isReactive, toRaw } from 'vue'
import { getValueByPath, parseJsonPointer } from './json-path-utils'
import { isLocalRef, isObject } from './general'
import type { UnknownObject } from './general'

/**
 * Proxy handler methods which resolve on the fly local ref json pointers
 */
function createProxyHandler(
  sourceDocument: UnknownObject,
  resolvedProxyCache?: WeakMap<object, UnknownObject>,
): ProxyHandler<UnknownObject> {
  return {
    get(target, property, receiver) {
      if (property === '__isProxy') {
        return true
      }

      const value = Reflect.get(target, property, receiver)

      if (isObject(value)) {
        if ('$ref' in value) {
          const ref = value.$ref as string

          // We skip resolving refs when they are chunks that needs to be resolved manually
          if (isLocalRef(ref)) {
            const referencePath = parseJsonPointer(ref)
            const resolvedValue = getValueByPath(sourceDocument, referencePath)
            if (resolvedValue) {
              return createMagicProxy(resolvedValue as UnknownObject, sourceDocument, resolvedProxyCache)
            }
          }
        }
        // Only pass required arguments
        return createMagicProxy(value, sourceDocument, resolvedProxyCache)
      }

      return value
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
 * Creates a proxy that automatically resolves JSON references.
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
