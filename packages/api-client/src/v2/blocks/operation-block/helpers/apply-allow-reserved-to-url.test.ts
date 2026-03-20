import { describe, expect, it } from 'vitest'

import { applyAllowReservedToUrl } from './apply-allow-reserved-to-url'

describe('applyAllowReservedToUrl', () => {
  it('returns URL unchanged when no allowReserved keys are provided', () => {
    const url = 'https://api.example.com/users?sort=name%3Aasc'
    const result = applyAllowReservedToUrl(url, new Set())

    expect(result).toBe(url)
  })

  it('decodes reserved characters for matching query keys only', () => {
    const url = 'https://api.example.com/users?sort=name%3Aasc&filter=status%3Aactive'
    const result = applyAllowReservedToUrl(url, new Set(['sort']))

    expect(result).toBe('https://api.example.com/users?sort=name:asc&filter=status%3Aactive')
  })

  it('keeps structural query characters percent-encoded for allowReserved keys', () => {
    const url = 'https://api.example.com/users?sort=name%3Aasc%23x%26y%3Dz%2Bv%3Fq%5B0%5D'
    const result = applyAllowReservedToUrl(url, new Set(['sort']))

    expect(result).toBe('https://api.example.com/users?sort=name:asc%23x%26y%3Dz%2Bv%3Fq%5B0%5D')
  })

  it('keeps non-reserved encodings unchanged for allowReserved keys', () => {
    const url = 'https://api.example.com/users?sort=name%3Aasc%20latest%25'
    const result = applyAllowReservedToUrl(url, new Set(['sort']))

    expect(result).toBe('https://api.example.com/users?sort=name:asc%20latest%25')
  })

  it('supports encoded query keys such as deepObject notation', () => {
    const url = 'https://api.example.com/users?filter%5Bsort%5D=name%3Aasc'
    const result = applyAllowReservedToUrl(url, new Set(['filter[sort]']))

    expect(result).toBe('https://api.example.com/users?filter%5Bsort%5D=name:asc')
  })
})
