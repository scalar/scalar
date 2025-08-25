import { describe, expect, it } from 'vitest'

import { objectToString } from './objectToString'

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
})
