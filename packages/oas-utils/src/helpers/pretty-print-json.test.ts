import { describe, expect, it } from 'vitest'

import { prettyPrintJson } from './pretty-print-json'

describe('prettyPrintJson', () => {
  it('makes JSON strings beautiful', async () => {
    expect(prettyPrintJson('{ "foo": "bar" }')).toMatch(`{\n  "foo": "bar"\n}`)
  })

  it('makes JS objects beautiful', async () => {
    expect(prettyPrintJson({ foo: 'bar' })).toMatch(`{\n  "foo": "bar"\n}`)
  })

  it("doesn't touch regular strings", async () => {
    expect(prettyPrintJson('foo')).toBe('foo')
  })

  it('transforms numbers', async () => {
    expect(prettyPrintJson(123)).toBe('123')
  })

  it('deals with circular references', async () => {
    const foo: Record<string, any> = { foo: 'bar' }

    // Add a circular reference
    foo.foo = foo

    expect(prettyPrintJson(foo)).toMatch(`{\n  "foo": "[Circular]"\n}`)
  })
})
