import { describe, expect, it } from 'vitest'

import { prettyPrintJson } from './pretty-print-json'

describe('prettyPrintJson', () => {
  it('makes JSON strings beautiful', () => {
    expect(prettyPrintJson('{ "foo": "bar" }')).toMatch(`{\n  "foo": "bar"\n}`)
  })

  it('makes JS objects beautiful', () => {
    expect(prettyPrintJson({ foo: 'bar' })).toMatch(`{\n  "foo": "bar"\n}`)
  })

  it("doesn't touch regular strings", () => {
    expect(prettyPrintJson('foo')).toBe('foo')
  })

  it('transforms numbers', () => {
    expect(prettyPrintJson(123)).toBe('123')
  })

  it('deals with circular references', () => {
    const foo: Record<string, any> = { foo: 'bar' }

    foo.foo = foo

    expect(prettyPrintJson(foo)).toMatch(`{\n  "foo": "[Circular]"\n}`)
  })

  it('expands a reference that is used more than once', () => {
    const id = { type: 'string', example: '12345678-1234-1234-1234-123456789012' }

    const result = prettyPrintJson({
      type: 'object',
      properties: { Id: id, ClientId: id, Name: { type: 'string' } },
    })

    expect(result).not.toContain('[Circular]')
    expect(JSON.parse(result).properties.ClientId).toEqual(id)
  })

  it('expands a shared reference at every occurrence while the graph stays small', () => {
    /*
     * The subtree below is reused by many sibling properties, but a full expansion stays well
     * under the node limit. So every occurrence should be shown in full rather than collapsed
     * to "[Circular]" after the first one.
     */
    const shared = { items: Array.from({ length: 100 }, (_, index) => ({ index })) }

    const root = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`ref${index}`, shared]))

    const result = prettyPrintJson(root)
    const parsed = JSON.parse(result)

    expect(result).not.toContain('[Circular]')
    expect(parsed.ref0).toEqual(shared)
    expect(parsed.ref9).toEqual(shared)
  })

  it('collapses a shared reference once its expansion would pass the node limit', () => {
    /*
     * Here the same subtree is shared widely enough that expanding it for every property would
     * emit far more nodes than the limit allows. Rather than freeze the tab, prettyPrintJson
     * falls back to collapsing the repeats: the first occurrence is still expanded in full and
     * the rest become "[Circular]". This is the non-cyclic counterpart to the deep-diamond case
     * below, and it exercises the node-count guard directly instead of exponential blow-up.
     */
    const shared = { items: Array.from({ length: 1000 }, (_, index) => ({ index })) }

    const root = Object.fromEntries(Array.from({ length: 200 }, (_, index) => [`ref${index}`, shared]))

    const parsed = JSON.parse(prettyPrintJson(root))

    // The first occurrence is expanded in full, later occurrences collapse to keep the output linear
    expect(parsed.ref0).toEqual(shared)
    expect(parsed.ref199).toBe('[Circular]')
  })

  it('does not explode on heavily shared references', () => {
    /*
     * A deeply resolved, recursive OpenAPI schema (e.g. the "Show Schema" toggle on a
     * self-referential type) produces a graph that reuses the same object reference in
     * many places. True cycles are already cut to "[circular]" strings, so JSON.stringify
     * never throws — instead it fully expands every shared subtree, which grows
     * exponentially with depth and freezes the browser tab.
     */
    const buildDiamond = (depth: number) => {
      let node: Record<string, unknown> = { leaf: true }
      for (let level = 0; level < depth; level++) {
        // Both branches point at the *same* object, doubling the expanded size per level
        node = { left: node, right: node }
      }
      return node
    }

    const result = prettyPrintJson(buildDiamond(20))

    // Collapsing repeated references keeps the output linear in the depth rather than 2^depth
    expect(result.length).toBeLessThan(10_000)
    expect(result).toContain('[Circular]')
  })

  it('does not explode on a graph that mixes real cycles with heavy sharing', () => {
    /*
     * Measuring the expanded size up front can under-count this shape: a node first reached through a
     * cycle is measured with its back-edge cut, yet it expands in full wherever the cycle is absent, so
     * the real output still grows as 2^depth. The node budget is therefore enforced while expanding
     * rather than predicted up front, so this falls back to collapsing repeats instead of freezing the
     * tab (or throwing on the maximum string length).
     */
    const buildCyclicDiamond = (depth: number): Record<string, unknown> => {
      if (depth === 0) {
        return { leaf: true }
      }

      const shared: Record<string, unknown> = { data: buildCyclicDiamond(depth - 1) }
      const cycle = { ref: shared }
      shared.cycle = cycle

      // `shared` is used twice and `shared.cycle.ref` points back to it: a real cycle plus sharing
      return { a: shared, b: cycle }
    }

    const result = prettyPrintJson(buildCyclicDiamond(40))

    // Bounded output rather than 2^depth, and no thrown RangeError
    expect(result.length).toBeLessThan(1_000_000)
    expect(result).toContain('[Circular]')
  })
})
