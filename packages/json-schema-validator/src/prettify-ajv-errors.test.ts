import { describe, expect, it } from 'vitest'

import { type AjvError, prettifyAjvErrors } from './prettify-ajv-errors'

describe('prettify-ajv-errors', () => {
  it('keeps the required error when an anyOf error and children sit at the same node', () => {
    // Ajv can report a `required` error next to an `anyOf` error at the same
    // instancePath, plus a more specific child error. The `required` message is
    // the actionable one and must survive the pruning.
    const errors: AjvError[] = [
      {
        keyword: 'required',
        instancePath: '/foo',
        message: "must have required property 'name'",
        params: { missingProperty: 'name' },
      },
      { keyword: 'anyOf', instancePath: '/foo', message: 'must match a schema in anyOf', params: {} },
      { keyword: 'type', instancePath: '/foo/bar', message: 'must be string', params: {} },
    ]

    const result = prettifyAjvErrors({ foo: {} }, errors)

    expect(result).toContainEqual(expect.objectContaining({ message: "must have required property 'name'" }))
  })
})
