import { describe, expect, it } from 'vitest'

import { getSafeSdkUrl, getSdkUrlLabel } from './sdk-url-label'

describe('getSafeSdkUrl', () => {
  it('allows https URLs', () => {
    expect(getSafeSdkUrl('https://github.com/scalar/scalar')).toBe('https://github.com/scalar/scalar')
  })

  it('allows http URLs', () => {
    expect(getSafeSdkUrl('http://example.com/sdk')).toBe('http://example.com/sdk')
  })

  it('rejects javascript: URLs', () => {
    expect(getSafeSdkUrl('javascript:alert(1)')).toBeUndefined()
  })

  it('rejects data: URLs', () => {
    expect(getSafeSdkUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined()
  })

  it('rejects unparseable values', () => {
    expect(getSafeSdkUrl('not a url')).toBeUndefined()
  })
})

describe('getSdkUrlLabel', () => {
  it('labels GitHub URLs', () => {
    expect(getSdkUrlLabel('https://github.com/scalar/scalar')).toBe('View on GitHub')
  })

  it('labels npm URLs', () => {
    expect(getSdkUrlLabel('https://www.npmjs.com/package/@scalar/api-client')).toBe('View on npm')
  })

  it('labels PyPI URLs', () => {
    expect(getSdkUrlLabel('https://pypi.org/project/scalar-sdk/')).toBe('View on PyPI')
  })

  it('matches subdomains of known hosts', () => {
    expect(getSdkUrlLabel('https://gist.github.com/someone/abc')).toBe('View on GitHub')
  })

  it('falls back to the URL for unknown hosts', () => {
    expect(getSdkUrlLabel('https://example.com/sdk')).toBe('https://example.com/sdk')
  })

  it('falls back to the input for unparseable URLs', () => {
    expect(getSdkUrlLabel('not a url')).toBe('not a url')
  })
})
