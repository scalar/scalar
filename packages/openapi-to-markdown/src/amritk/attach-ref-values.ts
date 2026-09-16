import { resolvePointer } from './resolve-pointer'

/** The key `@scalar/workspace-store`'s `getResolvedRef`/`resolve` read to follow a `$ref`. */
const REF_VALUE = '$ref-value'

type RefNode = { $ref: string } & Record<string, unknown>

const isRefNode = (value: unknown): value is RefNode =>
  typeof value === 'object' && value !== null && typeof (value as Record<string, unknown>)['$ref'] === 'string'

/**
 * Attaches a non-enumerable `$ref-value` pointer to every internal `{ $ref }`
 * node in `document`, pointing at the resolved target **by identity**.
 *
 * This is the compatibility seam between our store and the vendored Scalar
 * components: their `getResolvedRef(node)` / `resolve.schema(node)` read
 * `node['$ref-value']` context-free (the upstream magic-proxy inlined it). Our
 * store keeps `#/...` refs intact, so we materialise that same shape here —
 * without the proxy overhead.
 *
 * Design:
 * - **Pointers, not clones** — `$ref-value` shares object identity with the
 *   target, so this is O(1) per ref, cycle-safe, and keeps the document graph
 *   compact (no recursive expansion of recursive schemas).
 * - **Non-enumerable** — skipped by `JSON.stringify`, so the cycles introduced
 *   by ref pointers never reach `exportState()` and the SSR payload stays plain
 *   JSON. Re-run on the client after hydration to rebuild the pointers.
 * - **Reactivity** — when run over a reactive document, the looked-up targets
 *   are the reactive nodes, so resolved values stay reactive on read.
 *
 * External refs are assumed already bundled (see `refs.ts`); a `$ref` whose
 * pointer cannot be resolved is left without a `$ref-value` so callers degrade
 * gracefully rather than caching a bad target.
 */
export const attachRefValues = (document: unknown): void => {
  const seen = new Set<object>()

  const visit = (node: unknown): void => {
    if (node === null || typeof node !== 'object') {
      return
    }
    if (seen.has(node)) {
      return
    }
    seen.add(node)

    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }

    const object = node as Record<string, unknown>

    if (isRefNode(object) && object['$ref'].startsWith('#') && !(REF_VALUE in object)) {
      const target = resolvePointer(document, object['$ref'].slice(1))
      if (target !== undefined) {
        Object.defineProperty(object, REF_VALUE, {
          value: target,
          enumerable: false,
          writable: true,
          configurable: true,
        })
      }
    }

    for (const key of Object.keys(object)) {
      visit(object[key])
    }
  }

  visit(document)
}

/** Attaches `$ref-value` pointers across every document in a workspace map. */
export const attachRefValuesToAll = (documents: Record<string, unknown>): void => {
  for (const document of Object.values(documents)) {
    attachRefValues(document)
  }
}
