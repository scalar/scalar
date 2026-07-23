import { describe, expect, it } from 'vitest'

import { HTTP_METHODS, type HttpMethod, httpMethods } from './http-methods'

describe('HTTP Methods', () => {
  it('should contain all standard HTTP methods', () => {
    const expectedMethods = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'query', 'trace']

    expect(HTTP_METHODS).toEqual(expectedMethods)
    expect(HTTP_METHODS).toHaveLength(expectedMethods.length)
  })

  it('includes the QUERY method', () => {
    expect(HTTP_METHODS).toContain('query')
    expect(httpMethods.has('query')).toBe(true)
  })

  it('should have a Set containing all HTTP methods', () => {
    expect(httpMethods.size).toBe(HTTP_METHODS.length)
    HTTP_METHODS.forEach((method) => {
      expect(httpMethods.has(method)).toBe(true)
    })
  })

  it('should allow valid HttpMethod type assignments', () => {
    const validMethods: HttpMethod[] = ['get', 'post', 'put', 'delete']
    expect(validMethods).toBeDefined()
  })

  it('should reject invalid HTTP methods', () => {
    // @ts-expect-error - Testing type safety
    const invalidMethod: HttpMethod = 'invalid'
    expect(httpMethods.has(invalidMethod)).toBe(false)
  })
})
