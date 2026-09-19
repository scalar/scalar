import { schemaSignature, signaturesMatch } from './schema-signature'

type CacheEntry<T> = {
  signature: readonly unknown[]
  value: T
}

/**
 * Depth of the schema walk currently running.
 *
 * Only the call a component makes is worth an entry. The walks these helpers
 * make into themselves are keyed by objects they have just built, which no
 * later call can present again, so caching them would only cost memory.
 */
let depth = 0

type Options<T> = {
  /**
   * Records everything the walk reads into its result. The default covers a walk
   * that materialises the graph a schema reaches; a walk that only reads a level
   * or two passes a cheaper one.
   */
  signature?: (schema: unknown) => unknown[]
  /**
   * Copies a cached value before it is handed out, for a walk whose result a
   * caller could write to. Omit it when the value is only ever read.
   */
  copy?: (value: T) => T
}

/**
 * A cache of values derived from schema nodes, safe to share across a document.
 *
 * The same schema is rendered by every row that references it and by every page
 * that shows it, and the walks in this directory cost milliseconds per node, so
 * the second reader should not repeat the first reader's work.
 *
 * Identity alone cannot decide that: a document can be edited in place under the
 * API client, and `unwrapForRead` has already taken these components off Vue's
 * dependency tracking, so nothing would tell the cache the node had changed.
 * Each entry therefore carries a signature — a flat record of every value the
 * walk reads into its result — and is used only while the live node still
 * produces the same one. Taking a signature is a read-only pass with no `$ref`
 * coercion and no allocation per node, so it costs a fraction of the walk it
 * replaces.
 */
export const createSchemaRenderCache = <T>({ signature = schemaSignature, copy }: Options<T> = {}) => {
  const entries = new WeakMap<object, CacheEntry<T>>()

  return (schema: unknown, compute: () => T): T => {
    if (depth > 0 || schema === null || typeof schema !== 'object') {
      return compute()
    }

    const entry = entries.get(schema)

    if (entry && signaturesMatch(entry.signature, signature(schema))) {
      return copy ? copy(entry.value) : entry.value
    }

    depth += 1

    try {
      const value = compute()

      // Taken after the walk, not before: a merge reaches one in-place write of
      // its own (see `unwrap-for-read.ts`), and that write is idempotent, so the
      // state it leaves behind is the one later calls will present.
      entries.set(schema, { signature: signature(schema), value })

      return copy ? copy(value) : value
    } finally {
      depth -= 1
    }
  }
}
