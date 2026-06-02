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
})
