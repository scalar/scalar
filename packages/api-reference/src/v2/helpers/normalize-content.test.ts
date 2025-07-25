import { describe, expect, it } from 'vitest'
import { normalizeContent } from './normalize-content'

describe('normalizeContent', () => {
  describe('function input', () => {
    it('should handle function that returns a string', () => {
      const content = () => '{"name": "test", "version": "1.0.0"}'
      const result = normalizeContent(content)

      expect(result).toEqual({
        name: 'test',
        version: '1.0.0',
      })
    })

    it('should handle function that returns an object', () => {
      const content = () => ({ name: 'test', version: '1.0.0' })
      const result = normalizeContent(content)

      expect(result).toEqual({
        name: 'test',
        version: '1.0.0',
      })
    })

    it('should handle nested function calls', () => {
      const innerContent = () => '{"nested": true}'
      const content = () => innerContent()
      const result = normalizeContent(content)

      expect(result).toEqual({
        nested: true,
      })
    })

    it('should handle function that returns undefined', () => {
      const content = () => undefined as any
      const result = normalizeContent(content)

      expect(result).toBeUndefined()
    })
  })

  describe('string input', () => {
    it('should parse valid JSON string', () => {
      const content = '{"openapi": "3.0.0", "info": {"title": "Test API"}}'
      const result = normalizeContent(content)

      expect(result).toEqual({
        openapi: '3.0.0',
        info: {
          title: 'Test API',
        },
      })
    })

    it('should parse valid YAML string', () => {
      const content = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
`
      const result = normalizeContent(content)

      expect(result).toEqual({
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })
    })

    it('should throw error for invalid JSON/YAML string', () => {
      const content = 'invalid json or yaml content'

      expect(() => normalizeContent(content)).toThrow()
    })

    it('should throw error for malformed JSON', () => {
      const content = '{"name": "test", "version": "1.0.0"'

      expect(() => normalizeContent(content)).toThrow()
    })

    it('should throw error for malformed YAML', () => {
      const content = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
  description: "This is a test
`

      expect(() => normalizeContent(content)).toThrow()
    })
  })

  describe('object input', () => {
    it('should return object as-is', () => {
      const content = { name: 'test', version: '1.0.0' }
      const result = normalizeContent(content)

      expect(result).toBe(content)
      expect(result).toEqual({
        name: 'test',
        version: '1.0.0',
      })
    })

    it('should handle complex nested objects', () => {
      const content = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'A test API',
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }
      const result = normalizeContent(content)

      expect(result).toBe(content)
      expect(result).toEqual(content)
    })

    it('should handle empty object', () => {
      const content = {}
      const result = normalizeContent(content)

      expect(result).toBe(content)
      expect(result).toEqual({})
    })
  })

  describe('undefined input', () => {
    it('should return undefined', () => {
      const result = normalizeContent(undefined)

      expect(result).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const content = ''

      expect(normalizeContent(content)).toBeUndefined()
    })

    it('should handle function that throws an error', () => {
      const content = () => {
        throw new Error('Function error')
      }

      expect(() => normalizeContent(content)).toThrow('Function error')
    })

    it('should handle function that returns null', () => {
      const content = () => null as any
      const result = normalizeContent(content)

      expect(result).toBeUndefined()
    })

    it('should handle function that returns primitive values', () => {
      const stringContent = () => '{"test": true}'
      const numberContent = () => 42 as any
      const booleanContent = () => true as any

      expect(normalizeContent(stringContent)).toEqual({ test: true })
      expect(normalizeContent(numberContent)).toBe(42)
      expect(normalizeContent(booleanContent)).toBe(true)
    })
  })

  describe('recursive function calls', () => {
    it('should handle deeply nested function calls', () => {
      const level3 = () => '{"deep": "value"}'
      const level2 = () => level3 as any
      const level1 = () => level2 as any
      const content = () => level1 as any

      const result = normalizeContent(content)

      expect(result).toEqual({
        deep: 'value',
      })
    })

    it('should handle function that returns another function', () => {
      const innerFn = () => '{"inner": "data"}'
      const content = () => innerFn as any

      const result = normalizeContent(content)

      expect(result).toEqual({
        inner: 'data',
      })
    })
  })
})
