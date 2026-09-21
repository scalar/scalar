import { unpackProxyShallow } from '@/helpers/unpack-proxy'

/**
 * How many writes the store has recorded against each document, keyed by the raw document object.
 *
 * Keyed on the raw object rather than on a proxy, because the writer and the reader hold different
 * views of the same document: the store writes through `reactive(detectChanges(overrides(magic(raw))))`,
 * while a reader may hold any inner layer — the API reference strips the outer two for schema reads.
 * `unpackProxyShallow` lands on the same object from any of them.
 */
const revisions = new WeakMap<object, number>()

/**
 * Records a write against a document.
 *
 * Called from the store's change hooks, which see every mutation made through the store.
 */
export const bumpDocumentRevision = (document: unknown): void => {
  const raw = unpackProxyShallow(document)
  if (typeof raw !== 'object' || raw === null) {
    return
  }

  revisions.set(raw, (revisions.get(raw) ?? 0) + 1)
}

/**
 * How many writes the store has recorded against a document, for a consumer caching derivations of its
 * nodes: the number changes whenever anything in the document does, so a cache entry taken at one
 * revision is known to be stale at the next, in constant time and without walking the document.
 *
 * Returns 0 for a document no store tracks — a plain or magic-proxied document on the server, say —
 * which is also what an untouched document reads, so a cache validating against it simply never sees a
 * change. Documents that are mutated outside the store are the caller's problem either way: nothing
 * observes those writes.
 *
 * The number is meaningful only against itself. It counts writes, not versions, and a single edit can
 * move it by more than one.
 *
 * It is a plain number, not a reactive source: reading it inside a Vue `computed` or `effect` tracks
 * nothing, so that computed will not re-run when the number moves. Use it to validate a cache entry at
 * the point of use — alongside whatever already makes the surrounding computed re-run — rather than as
 * the thing a computed depends on.
 */
export const getDocumentRevision = (document: unknown): number => {
  const raw = unpackProxyShallow(document)
  if (typeof raw !== 'object' || raw === null) {
    return 0
  }

  return revisions.get(raw) ?? 0
}
