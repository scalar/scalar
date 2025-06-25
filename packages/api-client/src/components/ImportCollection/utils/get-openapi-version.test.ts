import { describe, expect, it } from 'vitest'
import { getOpenApiVersion } from './get-openapi-version'

describe('get-openapi-version', () => {
  describe('getOpenApiVersion', () => {
    it('returns false for null input', () => {
      const result = getOpenApiVersion(null)
      expect(result).toBe(false)
    })

    it('returns false for empty string', () => {
      const result = getOpenApiVersion('')
      expect(result).toBe(false)
    })

    it('returns false for whitespace-only string', () => {
      const result = getOpenApiVersion('   \n\t  ')
      expect(result).toBe(false)
    })

    it('returns false for URL input', () => {
      const result = getOpenApiVersion('https://example.com/openapi.json')
      expect(result).toBe(false)
    })

    it('returns false for invalid JSON', () => {
      const result = getOpenApiVersion('{ invalid json }')
      expect(result).toBe(false)
    })

    it('returns false for invalid YAML', () => {
      const result = getOpenApiVersion('invalid: yaml: content:')
      expect(result).toBe(false)
    })

    it('returns false for JSON without openapi or swagger fields', () => {
      const result = getOpenApiVersion('{"name": "test", "version": "1.0.0"}')
      expect(result).toBe(false)
    })

    it('returns false for YAML without openapi or swagger fields', () => {
      const result = getOpenApiVersion('name: test\nversion: 1.0.0')
      expect(result).toBe(false)
    })

    it('identifies OpenAPI 3.0.0 JSON document', () => {
      const input = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      })
      const result = getOpenApiVersion(input)
      expect(result).toBe('OpenAPI 3.0.0 JSON')
    })

    it('identifies OpenAPI 3.1.0 JSON document', () => {
      const input = JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      })
      const result = getOpenApiVersion(input)
      expect(result).toBe('OpenAPI 3.1.0 JSON')
    })

    it('identifies Swagger 2.0 JSON document', () => {
      const input = JSON.stringify({
        swagger: '2.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      })
      const result = getOpenApiVersion(input)
      expect(result).toBe('Swagger 2.0 JSON')
    })

    it('identifies OpenAPI 3.0.0 YAML document', () => {
      const input = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`
      const result = getOpenApiVersion(input)
      expect(result).toBe('OpenAPI 3.0.0 YAML')
    })

    it('identifies OpenAPI 3.1.0 YAML document', () => {
      const input = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`
      const result = getOpenApiVersion(input)
      expect(result).toBe('OpenAPI 3.1.0 YAML')
    })

    it('identifies Swagger 2.0 YAML document', () => {
      const input = `
swagger: "2.0"
info:
  title: Test API
  version: 1.0.0
paths: {}
`
      const result = getOpenApiVersion(input)
      expect(result).toBe('Swagger 2.0 YAML')
    })

    it('handles JSON with additional fields', () => {
      const input = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        servers: [{ url: 'https://api.example.com' }],
        components: {},
      })
      const result = getOpenApiVersion(input)
      expect(result).toBe('OpenAPI 3.0.0 JSON')
    })

    it('handles YAML with additional fields', () => {
      const input = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
servers:
  - url: https://api.example.com
components: {}
`
      const result = getOpenApiVersion(input)
      expect(result).toBe('OpenAPI 3.0.0 YAML')
    })

    it('prioritizes openapi over swagger in JSON', () => {
      const input = JSON.stringify({
        openapi: '3.0.0',
        swagger: '2.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      })
      const result = getOpenApiVersion(input)
      expect(result).toBe('OpenAPI 3.0.0 JSON')
    })

    it('prioritizes openapi over swagger in YAML', () => {
      const input = `
openapi: 3.0.0
swagger: 2.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`
      const result = getOpenApiVersion(input)
      expect(result).toBe('OpenAPI 3.0.0 YAML')
    })

    it('handles malformed JSON with valid openapi field', () => {
      const input = '{"openapi": "3.0.0", "info": {, "paths": {}}'
      const result = getOpenApiVersion(input)
      expect(result).toBe(false)
    })

    it('handles malformed YAML with valid openapi field', () => {
      const input = 'openapi: 3.0.0\ninfo:\n  title: Test API\n  version: 1.0.0\npaths: {'
      const result = getOpenApiVersion(input)
      expect(result).toBe(false)
    })

    it('handles non-string openapi value in JSON', () => {
      const input = JSON.stringify({
        openapi: 3.0,
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      })
      const result = getOpenApiVersion(input)
      expect(result).toBe(false)
    })

    it('handles non-string swagger value in JSON', () => {
      const input = JSON.stringify({
        swagger: 2.0,
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      })
      const result = getOpenApiVersion(input)
      expect(result).toBe(false)
    })

    it('handles non-string openapi value in YAML', () => {
      const input = `
openapi: 3.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`
      const result = getOpenApiVersion(input)
      expect(result).toBe(false)
    })

    it('handles non-string swagger value in YAML', () => {
      const input = `
swagger: 2.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`
      const result = getOpenApiVersion(input)
      expect(result).toBe(false)
    })
  })
})
