import { describe, expect, it } from 'vitest'

import { getUrlQueryParameter } from './get-url-query-parameter'

describe('getUrlQueryParameter', () => {
  const mockLocation = (search: string): void => {
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: { search },
    })
  }

  it('returns the value of an existing query parameter', () => {
    mockLocation('?api=https://example.com/openapi.json')

    const result = getUrlQueryParameter('api')

    expect(result).toBe('https://example.com/openapi.json')
  })

  it('returns null when the query parameter does not exist', () => {
    mockLocation('?other=value')

    const result = getUrlQueryParameter('api')

    expect(result).toBe(null)
  })

  it('returns null when there are no query parameters', () => {
    mockLocation('')

    const result = getUrlQueryParameter('api')

    expect(result).toBe(null)
  })

  it('returns the value when multiple query parameters exist', () => {
    mockLocation('?api=https://example.com&format=json&version=3.0')

    const result = getUrlQueryParameter('format')

    expect(result).toBe('json')
  })

  it('returns an empty string when the parameter has no value', () => {
    mockLocation('?api=')

    const result = getUrlQueryParameter('api')

    expect(result).toBe('')
  })

  it('returns an empty string when the parameter has no equals sign', () => {
    mockLocation('?api')

    const result = getUrlQueryParameter('api')

    expect(result).toBe('')
  })

  it('handles URL-encoded parameter values', () => {
    mockLocation('?api=https%3A%2F%2Fexample.com%2Fopenapi.json')

    const result = getUrlQueryParameter('api')

    expect(result).toBe('https://example.com/openapi.json')
  })

  it('handles special characters in parameter values', () => {
    mockLocation('?name=John%20Doe&email=test%40example.com')

    const nameResult = getUrlQueryParameter('name')
    const emailResult = getUrlQueryParameter('email')

    expect(nameResult).toBe('John Doe')
    expect(emailResult).toBe('test@example.com')
  })

  it('returns the first value when duplicate parameters exist', () => {
    mockLocation('?api=first&api=second')

    const result = getUrlQueryParameter('api')

    expect(result).toBe('first')
  })

  it('is case-sensitive for parameter names', () => {
    mockLocation('?API=value')

    const lowerResult = getUrlQueryParameter('api')
    const upperResult = getUrlQueryParameter('API')

    expect(lowerResult).toBe(null)
    expect(upperResult).toBe('value')
  })

  it('handles parameters with numeric values', () => {
    mockLocation('?page=42&limit=100')

    const result = getUrlQueryParameter('page')

    expect(result).toBe('42')
  })

  it('handles parameters with boolean-like values', () => {
    mockLocation('?debug=true&verbose=false')

    const debugResult = getUrlQueryParameter('debug')
    const verboseResult = getUrlQueryParameter('verbose')

    expect(debugResult).toBe('true')
    expect(verboseResult).toBe('false')
  })

  it('handles parameters with special characters in names', () => {
    mockLocation('?my-param=value&another_param=test')

    const hyphenResult = getUrlQueryParameter('my-param')
    const underscoreResult = getUrlQueryParameter('another_param')

    expect(hyphenResult).toBe('value')
    expect(underscoreResult).toBe('test')
  })

  it('handles ampersand in the beginning of search string', () => {
    mockLocation('&api=value')

    const result = getUrlQueryParameter('api')

    expect(result).toBe('value')
  })

  it('handles parameters with plus signs as spaces', () => {
    mockLocation('?name=John+Doe')

    const result = getUrlQueryParameter('name')

    expect(result).toBe('John Doe')
  })
})
