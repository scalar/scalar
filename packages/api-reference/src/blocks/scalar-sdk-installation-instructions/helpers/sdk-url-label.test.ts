import { describe, expect, it } from 'vitest'

import { getSdkUrlLabel } from './sdk-url-label'

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
