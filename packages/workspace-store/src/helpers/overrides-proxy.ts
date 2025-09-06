import { type UnknownObject, isObject } from '@/helpers/general'

const isOverridesProxy = Symbol('isOverridesProxy')

/**
 * Recursively makes all properties of a type optional.
 *
 * - If T is an object, recursively applies DeepPartial to each property, making them optional.
 * - Otherwise, T is returned as-is.
 *
 * @template T - The type to make deeply partial (optional).
 * @example
 * type Example = { a: { b: number } }
 * type PartialExample = DeepPartial<Example>
 * // Result: { a?: { b?: number } }
 */
export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T

/**
 * Creates a proxy object that overlays "overrides" on top of a target object.
 *
 * - When reading a property, if an override exists, it is returned; otherwise, the original value is returned.
 * - When writing to a property, if an override exists, it is updated; otherwise, the original object is updated.
 * - This works recursively for nested objects, so overrides can be deeply partial.
 * - Special symbols are used to identify the proxy and to access the original target.
 *
 * @template T - The type of the target object.
 * @param targetObject - The original object to proxy.
 * @param overrides - An optional object containing override values (deeply partial).
 * @returns A proxy object that reflects overrides on top of the target.
 *
 * @example
 * const original = { a: 1, b: { c: 2 } }
 * const overrides = { b: { c: 42 } }
 * const proxy = createOverridesProxy(original, overrides)
 *
 * console.log(proxy.a) // 1 (from original)
 * console.log(proxy.b.c) // 42 (from overrides)
 *
 * proxy.a = 100
 * console.log(original.a) // 100
 *
 * proxy.b.c = 99
 * console.log(overrides.b.c) // 99
 */
export const createOverridesProxy = <T extends Record<string, unknown>>(
  targetObject: T,
  overrides?: DeepPartial<T>,
): T => {
  if (!targetObject || typeof targetObject !== 'object') {
    return targetObject
  }

  // Proxy handler to intercept get/set operations
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      // Special symbol to identify this as an overrides proxy
      if (prop === isOverridesProxy) {
        return true
      }

      // Special symbol to access the original target object
      if (prop === TARGET_SYMBOL) {
        return target
      }

      const value = Reflect.get(target, prop, receiver)

      // If the value is not an object, return the override if it exists, else the original value
      if (!isObject(value)) {
        return Reflect.get(overrides ?? {}, prop) ?? value
      }

      // For nested objects, recursively create a proxy with the corresponding overrides
      return createOverridesProxy(value, Reflect.get(overrides ?? {}, prop))
    },

    set(target, prop, value, receiver) {
      // Prevent setting special symbols
      if (prop === isOverridesProxy || prop === TARGET_SYMBOL) {
        return false
      }

      // If an override exists for this property, update it
      const hasOverride = overrides && Reflect.has(overrides, prop)

      if (hasOverride && overrides && typeof overrides === 'object') {
        ;(overrides as any)[prop] = value
        return true
      }

      // Otherwise, update the original target
      return Reflect.set(target, prop, value, receiver)
    },
  }

  // Return the proxy object
  return new Proxy<T>(targetObject, handler)
}

export const TARGET_SYMBOL = Symbol('overridesProxyTarget')
export function unpackOverridesProxy<T extends UnknownObject>(obj: T): T {
  if ((obj as T & { [isOverridesProxy]: boolean | undefined })[isOverridesProxy]) {
    return (obj as T & { [TARGET_SYMBOL]: T })[TARGET_SYMBOL]
  }

  return obj
}
