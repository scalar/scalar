import { DYNAMIC_REF_VALUE, getRaw, isDynamicRef } from '@scalar/json-magic/magic-proxy'

import { unpackProxyShallow } from '@/helpers/unpack-proxy'

/**
 * Snapshot each schema object once, retaining shared and recursive references.
 * Read through the proxy so reactive edits remain tracked and references resolve.
 * Scoped proxies have distinct bindings even when they wrap the same raw schema.
 * Synthetic reference targets stay accessible to the generator but are omitted
 * when literal example data is serialized.
 */
export const snapshotSchema = <T>(source: T, seen = new WeakMap<object, object>()): T => {
  if (typeof source !== 'object' || source === null) {
    return source
  }

  const raw = unpackProxyShallow(source)
  const isProxied = getRaw(source) !== source
  const identity = isProxied ? source : raw
  const existing = seen.get(identity)
  if (existing) {
    return existing as T
  }

  const snapshot = Array.isArray(source) ? [] : {}
  seen.set(identity, snapshot)
  for (const key of Object.keys(source)) {
    // Data descriptors also preserve literal __proto__ and inherited accessor names.
    Object.defineProperty(snapshot, key, {
      value: snapshotSchema(Reflect.get(source, key), seen),
      enumerable: key !== '$ref-value' || Object.hasOwn(raw, key),
      configurable: true,
      writable: true,
    })
  }
  // Static document loaders can keep reference targets non-enumerable.
  if ('$ref' in source && '$ref-value' in source && !Object.hasOwn(snapshot, '$ref-value')) {
    Object.defineProperty(snapshot, '$ref-value', {
      value: snapshotSchema(Reflect.get(source, '$ref-value'), seen),
      configurable: true,
      writable: true,
    })
  }
  if (isDynamicRef(source) && (isProxied || Object.hasOwn(source, DYNAMIC_REF_VALUE))) {
    Object.defineProperty(snapshot, DYNAMIC_REF_VALUE, {
      value: snapshotSchema(Reflect.get(source, DYNAMIC_REF_VALUE), seen),
      configurable: true,
    })
  }
  return snapshot as T
}
