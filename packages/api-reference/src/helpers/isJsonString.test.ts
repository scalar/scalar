import { describe, expect, it } from 'vitest'

import { isJsonString } from './isJsonString'

describe('isJsonString', () => {
  it('keeps a path as is', async () => {
    expect(isJsonString('foobar')).toBe(false)
  })

  it('removes slash', async () => {
    expect(isJsonString('{ "foo": "bar" }')).toBe(true)
  })

  it('trims whitespace', async () => {
    expect(isJsonString({ foo: 'bar' })).toBe(false)
  })
})
