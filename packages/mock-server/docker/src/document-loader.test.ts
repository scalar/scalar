import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadDocument } from './document-loader'

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

// Mock path module
vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/')),
}))

describe('loadDocument', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.OPENAPI_DOCUMENT
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('with OPENAPI_DOCUMENT environment variable', () => {
    it('should load JSON document from environment variable', () => {
      const jsonDoc = '{"openapi":"3.0.0","info":{"title":"Test","version":"1.0.0"}}'
      process.env.OPENAPI_DOCUMENT = jsonDoc

      const result = loadDocument()

      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.json', jsonDoc, 'utf8')
      expect(result).toEqual({
        path: '/tmp/openapi.json',
        format: 'json',
      })
    })

    it('should load YAML document from environment variable', () => {
      const yamlDoc = 'openapi: 3.0.0\ninfo:\n  title: Test\n  version: 1.0.0'
      process.env.OPENAPI_DOCUMENT = yamlDoc

      const result = loadDocument()

      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.yaml', yamlDoc, 'utf8')
      expect(result).toEqual({
        path: '/tmp/openapi.yaml',
        format: 'yaml',
      })
    })

    it('should detect JSON format when content starts with {', () => {
      const jsonDoc = '{"openapi":"3.0.0"}'
      process.env.OPENAPI_DOCUMENT = jsonDoc

      const result = loadDocument()

      expect(result.format).toBe('json')
    })

    it('should detect JSON format when content starts with [', () => {
      const jsonDoc = '[{"openapi":"3.0.0"}]'
      process.env.OPENAPI_DOCUMENT = jsonDoc

      const result = loadDocument()

      expect(result.format).toBe('json')
    })

    it('should default to YAML format when content is not valid JSON', () => {
      const yamlDoc = 'openapi: 3.0.0'
      process.env.OPENAPI_DOCUMENT = yamlDoc

      const result = loadDocument()

      expect(result.format).toBe('yaml')
    })
  })

  describe('with volume mount', () => {
    it('should find OpenAPI document in /docs directory', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['openapi.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('openapi: 3.0.0\ninfo:\n  title: Test')

      const result = loadDocument()

      expect(existsSync).toHaveBeenCalledWith('/docs')
      expect(readdirSync).toHaveBeenCalledWith('/docs')
      expect(result).toEqual({
        path: '/docs/openapi.yaml',
        format: 'yaml',
      })
    })

    it('should find OpenAPI JSON document in /docs directory', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['openapi.json'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('{"openapi":"3.0.0","info":{"title":"Test"}}')

      const result = loadDocument()

      expect(result).toEqual({
        path: '/docs/openapi.json',
        format: 'json',
      })
    })

    it('should recursively search subdirectories', () => {
      vi.mocked(existsSync).mockImplementation((path) => {
        return path === '/docs' || path === '/docs/subdir'
      })
      vi.mocked(readdirSync)
        .mockReturnValueOnce(['subdir'] as any)
        .mockReturnValueOnce(['openapi.yaml'] as any)
      vi.mocked(statSync)
        .mockReturnValueOnce({
          isDirectory: () => true,
        } as any)
        .mockReturnValueOnce({
          isDirectory: () => false,
        } as any)
      vi.mocked(readFileSync).mockReturnValue('openapi: 3.0.0\ninfo:\n  title: Test')

      const result = loadDocument()

      expect(result.path).toBe('/docs/subdir/openapi.yaml')
    })

    it('should detect OpenAPI document with openapi: prefix', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['api.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('openapi: 3.0.0')

      const result = loadDocument()

      expect(result.path).toBe('/docs/api.yaml')
    })

    it('should detect OpenAPI document with "openapi" JSON key', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['api.json'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('{"openapi":"3.0.0"}')

      const result = loadDocument()

      expect(result.path).toBe('/docs/api.json')
    })

    it('should detect Swagger document with swagger: prefix', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['swagger.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('swagger: 2.0')

      const result = loadDocument()

      expect(result.path).toBe('/docs/swagger.yaml')
    })

    it('should detect Swagger document with "swagger" JSON key', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['swagger.json'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('{"swagger":"2.0"}')

      const result = loadDocument()

      expect(result.path).toBe('/docs/swagger.json')
    })

    it('should skip non-OpenAPI files', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['other.yaml', 'openapi.yaml'] as any)
      vi.mocked(statSync)
        .mockReturnValueOnce({
          isDirectory: () => false,
        } as any)
        .mockReturnValueOnce({
          isDirectory: () => false,
        } as any)
      vi.mocked(readFileSync).mockReturnValueOnce('not an openapi document').mockReturnValueOnce('openapi: 3.0.0')

      const result = loadDocument()

      expect(result.path).toBe('/docs/openapi.yaml')
    })

    it('should skip non-YAML/JSON files', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['readme.txt', 'openapi.yaml'] as any)
      vi.mocked(statSync)
        .mockReturnValueOnce({
          isDirectory: () => false,
        } as any)
        .mockReturnValueOnce({
          isDirectory: () => false,
        } as any)
      vi.mocked(readFileSync).mockReturnValue('openapi: 3.0.0')

      const result = loadDocument()

      expect(result.path).toBe('/docs/openapi.yaml')
    })

    it('should handle errors when scanning directory', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      expect(() => loadDocument()).toThrow('No OpenAPI document found')
    })
  })

  describe('error handling', () => {
    it('should throw error when no document is found', () => {
      vi.mocked(existsSync).mockReturnValue(false)

      expect(() => loadDocument()).toThrow(
        'No OpenAPI document found. Please provide via OPENAPI_DOCUMENT, or volume mount to /docs',
      )
    })

    it('should throw error when /docs directory exists but contains no OpenAPI documents', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['readme.txt'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('not an openapi document')

      expect(() => loadDocument()).toThrow(
        'No OpenAPI document found. Please provide via OPENAPI_DOCUMENT, or volume mount to /docs',
      )
    })

    it('should handle file read errors gracefully', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['openapi.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('Cannot read file')
      })

      expect(() => loadDocument()).toThrow('No OpenAPI document found')
    })
  })
})
