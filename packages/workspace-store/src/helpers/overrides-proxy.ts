import { isObject, type UnknownObject } from '@/helpers/general'
import type { DeepPartial } from '@/types'

const isOverridesProxy = Symbol('isOverridesProxy')

export const createOverridesProxy = <T extends object>(targetObject: T, overrides?: DeepPartial<T> | undefined): T => {
  if (!targetObject || typeof targetObject !== 'object') {
    return targetObject
  }

  // Create a handler for the proxy
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      if (prop === isOverridesProxy) {
        return true
      }

      if (prop === TARGET_SYMBOL) {
        // Return the original target object when accessing the TARGET_SYMBOL
        return target
      }

      const value = Reflect.get(target, prop, receiver)

      if (!isObject(value)) {
        return Reflect.get(overrides ?? {}, prop, receiver) ?? value
      }

      // If neither exists, return undefined
      // @ts-ignore
      return createOverridesProxy(value, overrides?.[prop])
    },
  }

  // Create and return the proxy
  return new Proxy<T>(targetObject, handler)
}

export const TARGET_SYMBOL = Symbol('overridesProxyTarget')
export function unpackOverridesProxy<T extends UnknownObject>(obj: T): T {
  if ((obj as T & { [isOverridesProxy]: boolean | undefined })[isOverridesProxy]) {
    return (obj as T & { [TARGET_SYMBOL]: T })[TARGET_SYMBOL]
  }

  return obj
}
