import { describe, expect, it } from 'vitest'

import { normalizeUrl } from './normalizeUrl'

describe('normalizeUrl', () => {
  it('keeps URLs as is', async () => {
    expect(normalizeUrl('http://127.0.0.1')).toBe('http://127.0.0.1/')
  })

  it('makes URLs lowercase', async () => {
    expect(normalizeUrl('http://EXAMPLE.COM')).toBe('http://example.com/')
  })

  it('makes hostname lowercase', async () => {
    expect(normalizeUrl('http://EXAMPLE.COM/API/v1/TeSt')).toBe(
      'http://example.com/API/v1/TeSt',
    )
  })

  it('adds http://', async () => {
    expect(normalizeUrl('example.com')).toBe('http://example.com/')
  })

  it('trims whitespace', async () => {
    expect(normalizeUrl('http://marc.com ')).toBe('http://marc.com/')
  })

  it('keeps paths as is ', async () => {
    expect(normalizeUrl('http://marc.com ')).toBe('http://marc.com/')
    expect(normalizeUrl('http://marc.com/path/ ')).toBe('http://marc.com/path/')
    expect(normalizeUrl('http://marc.com/path/v1 ')).toBe(
      'http://marc.com/path/v1',
    )
  })

  it('keeps query params as is ', async () => {
    expect(normalizeUrl('http://marc.com?marc=true')).toBe(
      'http://marc.com/?marc=true',
    )
    expect(normalizeUrl('http://marc.com/path/?okay=cool&neat=fun')).toBe(
      'http://marc.com/path/?okay=cool&neat=fun',
    )
  })

  it('ignores other types', async () => {
    // @ts-expect-error
    expect(normalizeUrl({})).toBe('')
  })
})
