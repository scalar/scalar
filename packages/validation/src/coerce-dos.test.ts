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
  it.each([false, true])('keeps acyclic subtree reads linear after a preceding cycle: %s', (cyclicParent) => {
    const readsAtDepth = (depth: number): number => {
      const reads = { count: 0 }
      const chain = (remaining: number): Record<string, unknown> => ({
        get kind() {
          reads.count++
          return 'a'
        },
        ...(remaining > 0 ? { next: chain(remaining - 1) } : {}),
      })
      const parent: Schema = lazy(() =>
        union([
          object({ kind: literal('a'), next: optional(parent), payload: node }),
          object({ kind: literal('b'), next: optional(parent), payload: node }),
        ]),
      )
      const value: Record<string, unknown> = { kind: 'a', payload: chain(depth) }
      value.next = value
      const result = cyclicParent
        ? (coerce(parent, value) as Record<string, unknown>).payload
        : coerce(node, value.payload)
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

  it('invalidates cyclic scores when a previously inactive ancestor becomes active', () => {
    const value: Record<string, unknown> = { kind: 'b' }
    value.next = value

    const result = coerce(node, value) as Record<string, unknown>
    // Reusing only by the ancestor that broke the previous cycle incorrectly selects branch b.
    expect(result.kind).toBe('a')
    expect(result.next).toBe(result)
  })

  it.each([0, 8])('shares cyclic scores in larger rings with a prefix of %s nodes', (prefixLength) => {
    const readsAtSize = (size: number): number => {
      const reads = { count: 0 }
      const ring: Record<string, unknown>[] = Array.from({ length: size }, () => ({
        get kind() {
          // Fail promptly if a regression brings back exponential work; synchronous loops block timeouts.
          if (++reads.count > size * size * 8) {
            throw new Error('Cyclic union scoring exceeded its quadratic read budget')
          }
          return 'a'
        },
      }))
      for (const [index, entry] of ring.entries()) {
        entry.next = ring[(index + 1) % ring.length]
      }
      let value = ring[0]!
      for (let index = 0; index < prefixLength; index++) {
        value = { kind: 'a', next: value }
      }
      let current = coerce(node, value) as Record<string, unknown>
      for (let index = 0; index < prefixLength; index++) {
        expect(current.kind).toBe('a')
        current = current.next as Record<string, unknown>
      }
      const ringStart = current
      for (const _entry of ring) {
        expect(current.kind).toBe('a')
        current = current.next as Record<string, unknown>
      }
      expect(current).toBe(ringStart)
      return reads.count
    }

    const reads = [32, 64, 128].map(readsAtSize)
    // Different ring roots can require different scores, but union alternatives must share them.
    // Doubling the ring is at most quadratic in reads, instead of exponentially expanding branches.
    expect(reads[1]!).toBeLessThan(reads[0]! * 4.2)
    expect(reads[2]!).toBeLessThan(reads[1]! * 4.2)
  })

  it('recomputes scores when an input changes between coercion calls', () => {
    const value = { kind: 'a' }
    expect(coerce(node, value)).toStrictEqual({ kind: 'a' })
    value.kind = 'b'
    expect(coerce(node, value)).toStrictEqual({ kind: 'b' })
  })
})
