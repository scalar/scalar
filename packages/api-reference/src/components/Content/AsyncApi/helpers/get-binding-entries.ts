import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyShallow } from '@scalar/workspace-store/helpers/unpack-proxy'

/** A protocol binding rendered without a protocol-specific field allowlist. */
type BindingEntry = {
  name: string
  fields: { name: string; content: string; nested: boolean }[]
}

const dataFields = new Set(['example', 'examples', 'default', 'enum', 'const'])
const schemaMaps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'])
const internalKeys = new Set(['$ref-value', '$global', '$status'])

/** Keep literal example/extension data intact while resolving actual reference objects. */
const snapshotBinding = (
  value: unknown,
  context: 'object' | 'map' | 'data' = 'object',
  seen = new WeakMap<object, unknown>(),
): unknown => {
  if (typeof value !== 'object' || value === null) {
    return value
  }
  const raw = unpackProxyShallow(value)
  if (seen.has(raw)) {
    return seen.get(raw)
  }
  if (context === 'object' && isObject(value) && typeof value.$ref === 'string') {
    const resolved = getResolvedRef(value)
    // Keep a readable pointer for unavailable or cyclic reference chains.
    seen.set(raw, { $ref: value.$ref })
    if (resolved !== undefined) {
      const result = snapshotBinding(resolved, context, seen)
      seen.set(raw, result)
      return result
    }
    return { $ref: value.$ref }
  }
  const result: Record<string, unknown> | unknown[] = Array.isArray(value) ? [] : {}
  seen.set(raw, result)
  for (const key of Object.keys(value)) {
    if (internalKeys.has(key) && (context !== 'data' || !Object.hasOwn(raw, key))) {
      continue
    }
    const childContext =
      context === 'data' || (context !== 'map' && (dataFields.has(key) || key.startsWith('x-')))
        ? 'data'
        : context !== 'map' && schemaMaps.has(key)
          ? 'map'
          : 'object'
    Object.defineProperty(result, key, {
      value: snapshotBinding(Reflect.get(value, key), childContext, seen),
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  return result
}

/** Resolve binding maps and retain unfamiliar fields, values, and unresolved pointers. */
export const getBindingEntries = (bindings: unknown): BindingEntry[] => {
  const resolved = snapshotBinding(bindings)
  if (!isObject(resolved)) {
    return []
  }
  const entries = typeof resolved.$ref === 'string' ? [['Reference', resolved] as const] : Object.entries(resolved)
  return entries
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ({
      name,
      fields: (isObject(value) ? Object.entries(value) : [['Value', value] as const])
        .filter(([, field]) => field !== undefined)
        .map(([name, field]) => ({
          name,
          content: typeof field === 'object' && field !== null ? prettyPrintJson(field) : JSON.stringify(field),
          nested: typeof field === 'object' && field !== null,
        })),
    }))
}
