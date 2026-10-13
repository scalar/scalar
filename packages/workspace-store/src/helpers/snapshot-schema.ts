import { unpackProxyShallow } from '@/helpers/unpack-proxy'

/**
 * Snapshot each schema object once, retaining shared and recursive references.
 * Unpacking is shallow: use the raw object only for identity and ownership, then
 * read through the proxy so reactive edits remain tracked and references resolve.
 * Synthetic reference targets stay accessible to the generator but are omitted
 * when literal example data is serialized.
 */
export const snapshotSchema = <T>(source: T, seen = new WeakMap<object, object>()): T => {
  if (typeof source !== 'object' || source === null) {
    return source
  }

  const raw = unpackProxyShallow(source)
  const existing = seen.get(raw)
  if (existing) {
    return existing as T
  }

  const snapshot = Array.isArray(source) ? [] : {}
  seen.set(raw, snapshot)
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
  return snapshot as T
}
