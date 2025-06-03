import { describe, it, expect } from 'vitest'
import { REQUEST_METHODS, getHttpMethodInfo } from './http-info'
import { HTTP_METHODS } from './http-methods'

describe('REQUEST_METHODS', () => {
  it('should have all required HTTP methods', () => {
    HTTP_METHODS.forEach((method) => {
      expect(REQUEST_METHODS).toHaveProperty(method)
    })
  })

  it('should have correct structure for each method', () => {
    Object.entries(REQUEST_METHODS).forEach(([_method, info]) => {
      expect(info).toHaveProperty('short')
      expect(info).toHaveProperty('colorClass')
      expect(info).toHaveProperty('colorVar')
      expect(info).toHaveProperty('backgroundColor')

      // Check colorClass format
      expect(info.colorClass).toMatch(/^text-[a-z0-9-]+$/)

      // Check colorVar format
      expect(info.colorVar).toMatch(/^var\(--scalar-color-[a-z0-9-]+\)$/)

      // Check backgroundColor format
      expect(info.backgroundColor).toMatch(/^bg-[a-z0-9-]+\/10$/)
    })
  })

  it('should have correct short names', () => {
    expect(REQUEST_METHODS.get.short).toBe('GET')
    expect(REQUEST_METHODS.post.short).toBe('POST')
    expect(REQUEST_METHODS.put.short).toBe('PUT')
    expect(REQUEST_METHODS.patch.short).toBe('PATCH')
    expect(REQUEST_METHODS.delete.short).toBe('DEL')
    expect(REQUEST_METHODS.options.short).toBe('OPTS')
    expect(REQUEST_METHODS.head.short).toBe('HEAD')
    expect(REQUEST_METHODS.connect.short).toBe('CONN')
    expect(REQUEST_METHODS.trace.short).toBe('TRACE')
  })
})

describe('getHttpMethodInfo', () => {
  it('should return correct info for valid HTTP methods', () => {
    const testCases: Array<{ input: string; expectedShort: string }> = [
      { input: 'GET', expectedShort: 'GET' },
      { input: 'Post', expectedShort: 'POST' },
      { input: '  put  ', expectedShort: 'PUT' },
      { input: 'PATCH', expectedShort: 'PATCH' },
      { input: 'delete', expectedShort: 'DEL' },
      { input: 'OPTIONS', expectedShort: 'OPTS' },
      { input: 'head', expectedShort: 'HEAD' },
      { input: 'CONNECT', expectedShort: 'CONN' },
      { input: 'trace', expectedShort: 'TRACE' },
    ]

    testCases.forEach(({ input, expectedShort }) => {
      const result = getHttpMethodInfo(input)
      expect(result.short).toBe(expectedShort)
      expect(result).toHaveProperty('colorClass')
      expect(result).toHaveProperty('backgroundColor')
    })
  })

  it('should handle unknown HTTP methods', () => {
    const unknownMethod = 'UNKNOWN'
    const result = getHttpMethodInfo(unknownMethod)

    expect(result.short).toBe('unknown')
    expect(result).toHaveProperty('color')
    expect(result).toHaveProperty('backgroundColor')
  })

  it('should handle empty string', () => {
    const result = getHttpMethodInfo('')
    expect(result.short).toBe('')
    expect(result).toHaveProperty('color')
    expect(result).toHaveProperty('backgroundColor')
  })

  it('should handle whitespace-only strings', () => {
    const result = getHttpMethodInfo('   ')
    expect(result.short).toBe('')
    expect(result).toHaveProperty('color')
    expect(result).toHaveProperty('backgroundColor')
  })
})
