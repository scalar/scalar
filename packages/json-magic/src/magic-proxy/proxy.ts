import { isLocalRef } from '@/bundle/bundle'
import type { UnknownObject } from '@/types'
import { isObject } from '@/utils/is-object'
import { getValueByPath, parseJsonPointer } from '@/utils/json-path-utils'

const isMagicProxy = Symbol('isMagicProxy')
const magicProxyTarget = Symbol('magicProxyTarget')

const REF_VALUE = '$ref-value'
const REF_KEY = '$ref'

export const createMagicProxy = <T extends Record<keyof T & symbol, unknown>, S extends UnknownObject>(
  target: T,
  root: S | T = target,
) => {
  if (!isObject(target) && !Array.isArray(target)) {
    return target
  }

  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      if (prop === isMagicProxy) {
        return true
      }

      if (prop === magicProxyTarget) {
        return target
      }

      const ref = Reflect.get(target, REF_KEY, receiver)

      if (prop === REF_VALUE && typeof ref === 'string' && isLocalRef(ref)) {
        return createMagicProxy(getValueByPath(root, parseJsonPointer(ref)), root)
      }

      const value = Reflect.get(target, prop, receiver)
      return createMagicProxy(value, root)
    },
    set(target, prop, newValue, receiver) {
      return Reflect.set(target, prop, newValue, receiver)
    },
    deleteProperty(target, prop) {
      return Reflect.deleteProperty(target, prop)
    },
    has(target, prop) {
      // Pretend that "$ref-value" exists if "$ref" exists
      if (prop === REF_VALUE && REF_KEY in target) {
        return true
      }
      return Reflect.has(target, prop)
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target)
      if (REF_KEY in target && !keys.includes(REF_VALUE)) {
        keys.push(REF_VALUE)
      }
      return keys
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === REF_VALUE && REF_KEY in target && typeof target[REF_KEY] === 'string') {
        return {
          configurable: true,
          enumerable: true,
          writable: false,
          value: (() => {
            if (isLocalRef(target[REF_KEY])) {
              return createMagicProxy(getValueByPath(root, parseJsonPointer(target[REF_KEY])), root)
            }
            return undefined
          })(),
        }
      }
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
export function getRaw<T extends UnknownObject>(obj: T): T {
  if ((obj as T & { [isMagicProxy]: boolean | undefined })[isMagicProxy]) {
    return (obj as T & { [magicProxyTarget]: T })[magicProxyTarget]
  }

  return obj
}
