import { isObject, type UnknownObject } from '@/helpers/general'

const isOverridesProxy = Symbol('isOverridesProxy')

export const createOverridesProxy = <T extends object>(targetObject: T, overrides?: unknown): T => {
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

    set(target, prop, value, receiver) {
      if (prop === isOverridesProxy || prop === TARGET_SYMBOL) {
        // Don't allow setting these special properties
        return false
      }

      // Check if there's an override for this property
      const hasOverride = overrides && Reflect.has(overrides, prop)

      if (hasOverride && overrides && typeof overrides === 'object') {
        // Set the value on the overrides object, but ignore the receiver to avoid proxy issues
        (overrides as any)[prop] = value
        return true
      }

      // Set the value on the original target
      return Reflect.set(target, prop, value, receiver)
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
