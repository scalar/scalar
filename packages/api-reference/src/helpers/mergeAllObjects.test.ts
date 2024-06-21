import { describe, expect, it } from 'vitest'

import { mergeAllObjects } from './mergeAllObjects'

describe('mergeAllObjects', () => {
  it('merges two objects', () => {
    expect(mergeAllObjects([{ foo: 'bar' }, { bar: 'foo' }])).toStrictEqual({
      foo: 'bar',
      bar: 'foo',
    })
  })

  it('overwrites first object', () => {
    expect(mergeAllObjects([{ foo: 'bar' }, { foo: 'foo' }])).toStrictEqual({
      foo: 'foo',
    })
  })

  it('merges objects with circular references', () => {
    const foobar: Record<string, any> = { foo: 'bar' }
    foobar.foo = foobar

    expect(mergeAllObjects([{ foo: 'bar' }, foobar])).toStrictEqual(foobar)
  })
})
