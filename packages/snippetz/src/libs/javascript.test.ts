import { describe, expect, it } from 'vitest'

import { objectToString } from './javascript'

describe('objectToString', () => {
  it('formats an empty object', () => {
    expect(objectToString({})).toBe('{}')
  })

  it('formats a simple object', () => {
    expect(objectToString({ foo: 'bar', baz: 'qux' })).toBe(`{
  foo: 'bar',
  baz: 'qux'
}`)
  })

  it('formats object with nested objects', () => {
    expect(objectToString({ foo: { bar: 'baz', qux: [{}, { foo: 'qux' }] } })).toBe(`{
  foo: {
    bar: 'baz',
    qux: [
      {},
      {
        foo: 'qux'
      }
    ]
  }
}`)
  })

  it('formats object with array values', () => {
    expect(objectToString({ foo: [1, 2, 3], bar: ['qux', 'quux'] })).toBe(`{
  foo: [1, 2, 3],
  bar: ['qux', 'quux']
}`)
  })

  it('quotes object keys that are not valid identifiers', () => {
    expect(
      objectToString({
        "it's": 'fine',
        'content-type': 'application/json',
        'with space': 'ok',
      }),
    ).toBe(`{
  'it\\'s': 'fine',
  'content-type': 'application/json',
  'with space': 'ok'
}`)
  })
})
