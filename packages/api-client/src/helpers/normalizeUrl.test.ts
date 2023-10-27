import { describe, expect, it } from 'vitest'

import { normalizeUrl } from './normalizeUrl'

describe('normalizeUrl', () => {
  it('keeps URLs as is', async () => {
    expect(normalizeUrl('http://127.0.0.1')).toBe('http://127.0.0.1')
  })

  it('keeps slashes', async () => {
    expect(normalizeUrl('http://127.0.0.1/')).toBe('http://127.0.0.1/')
  })

  it('makes URLs lowercase', async () => {
    expect(normalizeUrl('http://EXAMPLE.COM')).toBe('http://example.com')
  })

  it('adds http://', async () => {
    expect(normalizeUrl('example.com')).toBe('http://example.com')
  })

  it('trims whitespace', async () => {
    expect(normalizeUrl('http://example.com ')).toBe('http://example.com')
  })

  it('ignores other types', async () => {
    // @ts-expect-error
    expect(normalizeUrl({})).toBe('')
  })
})
