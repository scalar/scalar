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

// Mock global fetch
global.fetch = vi.fn()

describe('loadDocument', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.OPENAPI_DOCUMENT
    delete process.env.OPENAPI_DOCUMENT_URL
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('with command-line URL argument (--url)', () => {
    it('should fetch and load JSON document from command-line URL', async () => {
      const url = 'https://api.example.com/openapi.json'
      const jsonDoc = '{"openapi":"3.0.0","info":{"title":"Test","version":"1.0.0"}}'

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => jsonDoc,
      } as Response)

      const result = await loadDocument(url)

      expect(global.fetch).toHaveBeenCalledWith(url)
      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.json', jsonDoc, 'utf8')
      expect(result).toEqual({
        path: '/tmp/openapi.json',
        format: 'json',
      })
    })

    it('should fetch and load YAML document from command-line URL', async () => {
      const url = 'https://api.example.com/openapi.yaml'
      const yamlDoc = 'openapi: 3.0.0\ninfo:\n  title: Test\n  version: 1.0.0'

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => yamlDoc,
      } as Response)

      const result = await loadDocument(url)

      expect(global.fetch).toHaveBeenCalledWith(url)
      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.yaml', yamlDoc, 'utf8')
      expect(result).toEqual({
        path: '/tmp/openapi.yaml',
        format: 'yaml',
      })
    })

    it('should throw error when command-line URL fetch fails', async () => {
      const url = 'https://api.example.com/openapi.yaml'

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(loadDocument(url)).rejects.toThrow('Failed to fetch document from URL: 404 Not Found')
    })

    it('should have highest priority over environment variables', async () => {
      const url = 'https://api.example.com/openapi.yaml'
      const yamlDoc = 'openapi: 3.0.0\ninfo:\n  title: Test'
      process.env.OPENAPI_DOCUMENT = '{"openapi":"3.0.0"}'
      process.env.OPENAPI_DOCUMENT_URL = 'https://other.example.com/openapi.yaml'

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => yamlDoc,
      } as Response)

      const result = await loadDocument(url)

      expect(result.path).toBe('/tmp/openapi.yaml')
      expect(global.fetch).toHaveBeenCalledWith(url)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.yaml', yamlDoc, 'utf8')
    })
  })

  describe('with OPENAPI_DOCUMENT environment variable', () => {
    it('should load JSON document from environment variable', async () => {
      const jsonDoc = '{"openapi":"3.0.0","info":{"title":"Test","version":"1.0.0"}}'
      process.env.OPENAPI_DOCUMENT = jsonDoc

      const result = await loadDocument()

      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.json', jsonDoc, 'utf8')
      expect(result).toEqual({
        path: '/tmp/openapi.json',
        format: 'json',
      })
    })

    it('should load YAML document from environment variable', async () => {
      const yamlDoc = 'openapi: 3.0.0\ninfo:\n  title: Test\n  version: 1.0.0'
      process.env.OPENAPI_DOCUMENT = yamlDoc

      const result = await loadDocument()

      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.yaml', yamlDoc, 'utf8')
      expect(result).toEqual({
        path: '/tmp/openapi.yaml',
        format: 'yaml',
      })
    })

    it('should detect JSON format when content starts with {', async () => {
      const jsonDoc = '{"openapi":"3.0.0"}'
      process.env.OPENAPI_DOCUMENT = jsonDoc

      const result = await loadDocument()

      expect(result.format).toBe('json')
    })

    it('should detect JSON format when content starts with [', async () => {
      const jsonDoc = '[{"openapi":"3.0.0"}]'
      process.env.OPENAPI_DOCUMENT = jsonDoc

      const result = await loadDocument()

      expect(result.format).toBe('json')
    })

    it('should default to YAML format when content is not valid JSON', async () => {
      const yamlDoc = 'openapi: 3.0.0'
      process.env.OPENAPI_DOCUMENT = yamlDoc

      const result = await loadDocument()

      expect(result.format).toBe('yaml')
    })

    it('should have priority over OPENAPI_DOCUMENT_URL', async () => {
      const jsonDoc = '{"openapi":"3.0.0","info":{"title":"Test"}}'
      process.env.OPENAPI_DOCUMENT = jsonDoc
      process.env.OPENAPI_DOCUMENT_URL = 'https://api.example.com/openapi.yaml'

      const result = await loadDocument()

      expect(result.path).toBe('/tmp/openapi.json')
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('with OPENAPI_DOCUMENT_URL environment variable', () => {
    it('should fetch and load JSON document from URL', async () => {
      const url = 'https://api.example.com/openapi.json'
      const jsonDoc = '{"openapi":"3.0.0","info":{"title":"Test","version":"1.0.0"}}'
      process.env.OPENAPI_DOCUMENT_URL = url

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => jsonDoc,
      } as Response)

      const result = await loadDocument()

      expect(global.fetch).toHaveBeenCalledWith(url)
      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.json', jsonDoc, 'utf8')
      expect(result).toEqual({
        path: '/tmp/openapi.json',
        format: 'json',
      })
    })

    it('should fetch and load YAML document from URL', async () => {
      const url = 'https://api.example.com/openapi.yaml'
      const yamlDoc = 'openapi: 3.0.0\ninfo:\n  title: Test\n  version: 1.0.0'
      process.env.OPENAPI_DOCUMENT_URL = url

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => yamlDoc,
      } as Response)

      const result = await loadDocument()

      expect(global.fetch).toHaveBeenCalledWith(url)
      expect(writeFileSync).toHaveBeenCalledWith('/tmp/openapi.yaml', yamlDoc, 'utf8')
      expect(result).toEqual({
        path: '/tmp/openapi.yaml',
        format: 'yaml',
      })
    })

    it('should throw error when URL fetch fails', async () => {
      const url = 'https://api.example.com/openapi.yaml'
      process.env.OPENAPI_DOCUMENT_URL = url

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(loadDocument()).rejects.toThrow('Failed to fetch document from URL: 404 Not Found')
    })

    it('should throw error when URL fetch throws', async () => {
      const url = 'https://api.example.com/openapi.yaml'
      process.env.OPENAPI_DOCUMENT_URL = url

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      await expect(loadDocument()).rejects.toThrow(`Failed to fetch OpenAPI document from URL ${url}: Network error`)
    })

    it('should have priority over volume mount', async () => {
      const url = 'https://api.example.com/openapi.yaml'
      const yamlDoc = 'openapi: 3.0.0\ninfo:\n  title: Test'
      process.env.OPENAPI_DOCUMENT_URL = url

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => yamlDoc,
      } as Response)
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['openapi.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)

      const result = await loadDocument()

      expect(result.path).toBe('/tmp/openapi.yaml')
      expect(readdirSync).not.toHaveBeenCalled()
    })
  })

  describe('with volume mount', () => {
    it('should find OpenAPI document in /docs directory', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['openapi.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('openapi: 3.0.0\ninfo:\n  title: Test')

      const result = await loadDocument()

      expect(existsSync).toHaveBeenCalledWith('/docs')
      expect(readdirSync).toHaveBeenCalledWith('/docs')
      expect(result).toEqual({
        path: '/docs/openapi.yaml',
        format: 'yaml',
      })
    })

    it('should find OpenAPI JSON document in /docs directory', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['openapi.json'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('{"openapi":"3.0.0","info":{"title":"Test"}}')

      const result = await loadDocument()

      expect(result).toEqual({
        path: '/docs/openapi.json',
        format: 'json',
      })
    })

    it('should recursively search subdirectories', async () => {
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

      const result = await loadDocument()

      expect(result.path).toBe('/docs/subdir/openapi.yaml')
    })

    it('should detect OpenAPI document with openapi: prefix', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['api.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('openapi: 3.0.0')

      const result = await loadDocument()

      expect(result.path).toBe('/docs/api.yaml')
    })

    it('should detect OpenAPI document with "openapi" JSON key', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['api.json'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('{"openapi":"3.0.0"}')

      const result = await loadDocument()

      expect(result.path).toBe('/docs/api.json')
    })

    it('should detect Swagger document with swagger: prefix', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['swagger.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('swagger: 2.0')

      const result = await loadDocument()

      expect(result.path).toBe('/docs/swagger.yaml')
    })

    it('should detect Swagger document with "swagger" JSON key', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['swagger.json'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('{"swagger":"2.0"}')

      const result = await loadDocument()

      expect(result.path).toBe('/docs/swagger.json')
    })

    it('should skip non-OpenAPI files', async () => {
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

      const result = await loadDocument()

      expect(result.path).toBe('/docs/openapi.yaml')
    })

    it('should skip non-YAML/JSON files', async () => {
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

      const result = await loadDocument()

      expect(result.path).toBe('/docs/openapi.yaml')
    })

    it('should handle errors when scanning directory', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      await expect(loadDocument()).rejects.toThrow('No OpenAPI document found')
    })
  })

  describe('error handling', () => {
    it('should throw error when no document is found', async () => {
      vi.mocked(existsSync).mockReturnValue(false)

      await expect(loadDocument()).rejects.toThrow(
        'No OpenAPI document found. Please provide via --url <URL>, OPENAPI_DOCUMENT, OPENAPI_DOCUMENT_URL, or volume mount to /docs',
      )
    })

    it('should throw error when /docs directory exists but contains no OpenAPI documents', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['readme.txt'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockReturnValue('not an openapi document')

      await expect(loadDocument()).rejects.toThrow(
        'No OpenAPI document found. Please provide via --url <URL>, OPENAPI_DOCUMENT, OPENAPI_DOCUMENT_URL, or volume mount to /docs',
      )
    })

    it('should handle file read errors gracefully', async () => {
      vi.mocked(existsSync).mockReturnValue(true)
      vi.mocked(readdirSync).mockReturnValue(['openapi.yaml'] as any)
      vi.mocked(statSync).mockReturnValue({
        isDirectory: () => false,
      } as any)
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('Cannot read file')
      })

      await expect(loadDocument()).rejects.toThrow('No OpenAPI document found')
    })
  })
})
