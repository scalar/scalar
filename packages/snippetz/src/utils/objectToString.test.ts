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
})
