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

  it('preserves nested arrays at every depth', () => {
    expect(objectToString({ coordinates: [[1, 2], [], [[[3]]]] })).toBe(`{
  coordinates: [[1, 2], [], [[[3]]]]
}`)
  })

  it('preserves top-level arrays', () => {
    expect(objectToString([[1], [], [null, true, 'text']])).toBe("[[1], [], [null, true, 'text']]")
    expect(objectToString([])).toBe('[]')
  })

  it('indents objects inside nested arrays', () => {
    expect(objectToString({ items: [[{ values: [[1]] }]] })).toBe(`{
  items: [
    [
      {
        values: [[1]]
      }
    ]
  ]
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
