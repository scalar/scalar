import { describe, expect, it } from 'vitest'

import { normalizePath } from './normalizePath'

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

  it('keeps a slash if its the single character', async () => {
    expect(normalizePath('/')).toBe('/')
  })
})
