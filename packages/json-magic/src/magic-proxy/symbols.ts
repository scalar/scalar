export const isMagicProxy = Symbol('isMagicProxy')
export const magicProxyTarget = Symbol('magicProxyTarget')
export const magicProxyRevision = Symbol('magicProxyRevision')
export const dynamicAnchorCacheKey = Symbol('dynamicAnchorCacheKey')

/** Share anchor caches across one document revision, including store-wrapped proxy views. */
export const getDynamicAnchorCacheKey = (resource: object): { revision: number } | undefined =>
  Reflect.get(resource, dynamicAnchorCacheKey)

/** The virtual, get-only property resolving a reference against its dynamic scope. */
export const DYNAMIC_REF_VALUE = '$dynamicRef-value'

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
export const getRaw = <T>(obj: T): T => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if ((obj as T & { [isMagicProxy]: boolean | undefined })[isMagicProxy]) {
    return (obj as T & { [magicProxyTarget]: T })[magicProxyTarget]
  }

  return obj
}
