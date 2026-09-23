import { describe, expect, it, vi } from 'vitest'

import { coerce } from '@/coerce'
import { type Schema, lazy, literal, object, optional, union } from '@/schema'

/**
 * Security regression: `coerce` must stay roughly linear in the nesting depth of
 * its input, even for recursive `union` schemas.
 *
 * `coerce` picks a union branch with `scoreUnion`, which scores *every* branch
 * and takes the max. The recursion guard in `coerce.ts` is a cycle guard only
 * (it marks `(value, schema)` pairs currently on the call stack and clears them
 * in `finally`); it does not memoize completed sub-scores. So for a recursive
 * schema whose child is reachable through more than one branch, every nesting
 * level of the input is re-scored once per branch — O(2^depth) CPU for a
 * linear-size value.
 *
 * This is reachable from untrusted input: `@scalar/workspace-store` calls
 * `coerce(openapiSchema, document)` on user-supplied OpenAPI/AsyncAPI documents,
 * and the OpenAPI Schema Object is exactly this shape (`items` is recursive and
 * appears in two union branches). A sub-1KB document hangs the event loop for
 * seconds-to-minutes.
 *
 * The schema below distills that structure: a tagged node whose `next` child is
 * declared in both union branches. The fix bounds how far `scoreUnion` descends
 * into the value below each union node, so every branch decision costs the same
 * no matter how deep the input is.
 */
const node: Schema = lazy(() =>
  union([object({ kind: literal('a'), next: optional(node) }), object({ kind: literal('b'), next: optional(node) })]),
)

/** Builds a linear-size chain of `depth` nested nodes — a few hundred bytes of JSON. */
const buildChain = (depth: number): Record<string, unknown> => {
  let value: Record<string, unknown> = { kind: 'a' }
  for (let i = 0; i < depth; i++) {
    value = { kind: 'a', next: value }
  }
  return value
}

describe('coerce-dos', () => {
  it('coerces a recursive union in roughly linear time (no exponential branch scoring)', () => {
    // At depth 19 the input is ~400 bytes. With unbounded scoring this is
    // ~2^19 work and takes several seconds; with bounded scoring it is a few ms.
    const value = buildChain(19)

    const start = performance.now()
    const result = coerce(node, value)
    const elapsed = performance.now() - start

    // Coercion still works: the value matches a branch and is returned intact.
    expect(result).toMatchObject({ kind: 'a' })

    // The actual regression: this must not blow up exponentially.
    expect(elapsed).toBeLessThan(500)
  }, 30_000)

  it.each([100, 1_000])(
    'stays fast on a chain %i levels deep',
    (depth) => {
      // The cost per union node is constant, so going much deeper must not bring the blow-up back.
      // At 1,000 levels the value is also deep enough for coerce to stop at its nesting cap and
      // leave the deepest levels as they are.
      const value = buildChain(depth)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      try {
        const start = performance.now()
        const result = coerce(node, value)
        const elapsed = performance.now() - start

        expect(result).toMatchObject({ kind: 'a', next: { kind: 'a' } })
        expect(elapsed).toBeLessThan(500)
        expect(warn).toHaveBeenCalledTimes(depth > 100 ? 1 : 0)
      } finally {
        warn.mockRestore()
      }
    },
    30_000,
  )
})
