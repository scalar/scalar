import { describe, expect, it } from 'vitest'

import { coerce } from '@/coerce'
import { type Schema, lazy, literal, object, optional, union } from '@/schema'

/**
 * Regression for exponential union scoring: both branches visit the same child
 * at every level of a linear-size chain. The active-pair cycle guard alone does
 * not prevent rescoring completed children. Completed scores must be shared
 * across branches and across successive union selections during coercion.
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
    // At depth 19 the input is ~600 bytes. Without memoization, scoring is
    // ~2^19 work and takes several seconds; with memoization it is a few ms.
    const value = buildChain(19)

    const start = performance.now()
    const result = coerce(node, value)
    const elapsed = performance.now() - start

    // Coercion still works: the value matches a branch and is returned intact.
    expect(result).toStrictEqual(value)

    // The actual regression: this must not blow up exponentially.
    expect(elapsed).toBeLessThan(500)
  }, 30_000)

  it('keeps property reads linear across successive union selections', () => {
    const readsAtDepth = (depth: number): number => {
      const reads = { count: 0 }
      const chain = (remaining: number): Record<string, unknown> => ({
        get kind() {
          reads.count++
          return 'a'
        },
        ...(remaining > 0 ? { next: chain(remaining - 1) } : {}),
      })
      const result = coerce(node, chain(depth))
      expect(result).toStrictEqual(buildChain(depth))
      return reads.count
    }

    const reads = [8, 16, 32].map(readsAtDepth)
    // Doubling depth must not quadruple work by rescoring each remaining subtree.
    expect(reads[1]!).toBeLessThan(reads[0]! * 2.2)
    expect(reads[2]!).toBeLessThan(reads[1]! * 2.2)
  })

  it('does not reuse scores computed while an enclosing cycle is open', () => {
    const child: Record<string, unknown> = { kind: 'b' }
    child.next = child
    const value = { kind: 'b', next: child }

    const result = coerce(node, value) as Record<string, unknown>
    const next = result.next as Record<string, unknown>
    // The cycle-neutral score ties the child branches, selecting the first.
    // Caching that context-dependent score instead changes both branch choices.
    expect(result.kind).toBe('b')
    expect(next.kind).toBe('a')
    expect(next.next).toBe(next)
  })

  it('recomputes scores when an input changes between coercion calls', () => {
    const value = { kind: 'a' }
    expect(coerce(node, value)).toStrictEqual({ kind: 'a' })
    value.kind = 'b'
    expect(coerce(node, value)).toStrictEqual({ kind: 'b' })
  })
})
