import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { resolve } from '@scalar/workspace-store/resolve'
import type { MaybeRefSchemaObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/schema'

import { shallowSchemaSignature, signaturesMatch } from './schema-signature'

type ResolvedSchema<T> = T extends undefined ? undefined : SchemaObject & { $ref?: string }

type ResolvedEntry = {
  signature: readonly unknown[]
  value: SchemaObject & { $ref?: string }
}

const resolved = new WeakMap<object, ResolvedEntry>()

/**
 * Whether a resolved node is the plain shallow merge of a reference and its target.
 *
 * `resolve.schema` merges the reference's siblings onto the target and then casts
 * the result against the schema object type. For a document that already matches,
 * the cast hands the merged object straight back and the result is a function of
 * the two levels alone — which is what {@link shallowSchemaSignature} records.
 * A document the cast has to repair is rebuilt from the whole subtree, so it does
 * not belong in the cache; this check tells the two apart.
 */
const isShallowMerge = (node: Record<string, unknown>, target: unknown, value: Record<string, unknown>): boolean => {
  const sources = target !== null && typeof target === 'object' ? (target as Record<string, unknown>) : {}
  const expected = new Set(Object.keys(sources))

  for (const key of Object.keys(node)) {
    if (key !== '$ref-value') {
      expected.add(key)
    }
  }

  const keys = Object.keys(value)

  if (keys.length !== expected.size) {
    return false
  }

  for (const key of keys) {
    if (!expected.has(key)) {
      return false
    }

    const source = key !== '$ref-value' && key in node ? node[key] : sources[key]

    if (!Object.is(value[key], source)) {
      return false
    }
  }

  return true
}

/**
 * Resolves a schema node, handing back the same object for the same reference.
 *
 * Every row below a schema derives from the object this returns, so resolving a
 * reference afresh each time does two kinds of damage: it repeats the cast (the
 * single most expensive read on the render path), and it hands each row a node
 * no other row has seen, which no cache keyed by identity can reuse. One object
 * per reference fixes both.
 *
 * The entry is kept only while the reference and its target still read the same,
 * so a document edited in place under the API client resolves again.
 */
export const resolveSchemaNode = <T extends MaybeRefSchemaObject | undefined>(node: T): ResolvedSchema<T> => {
  if (node === null || typeof node !== 'object' || !('$ref' in node)) {
    return resolve.schema(node) as ResolvedSchema<T>
  }

  const signature = shallowSchemaSignature(node)
  const entry = resolved.get(node)

  if (entry && signaturesMatch(entry.signature, signature)) {
    return entry.value as ResolvedSchema<T>
  }

  const value = resolve.schema(node)

  if (
    value !== null &&
    typeof value === 'object' &&
    isShallowMerge(
      node as unknown as Record<string, unknown>,
      getResolvedRef(node as unknown as { $ref: string; '$ref-value': unknown }),
      value as unknown as Record<string, unknown>,
    )
  ) {
    resolved.set(node, { signature, value })
  }

  return value as ResolvedSchema<T>
}
