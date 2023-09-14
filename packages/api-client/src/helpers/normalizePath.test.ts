import { describe, expect, it } from 'vitest'

import { normalizePath } from './'

describe('normalizePath', () => {
  it('keeps a path as is', async () => {
    expect(normalizePath('foobar')).toBe('foobar')
  })

  it('removes slash', async () => {
    expect(normalizePath('/foobar')).toBe('foobar')
  })

  it('trims whitespace', async () => {
    expect(normalizePath('foobar ')).toBe('foobar')
  })
})
