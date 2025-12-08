import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ServerObject } from '@/schemas/v3.1/strict/server'

import { getServersFromDocument } from './server'

describe('servers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('window', {
      location: {
        origin: 'https://example.com',
      },
    })
  })

  describe('getServersFromDocument', () => {
    it('returns empty array when no servers provided and no fallback available', () => {
      vi.stubGlobal('window', undefined)

      const result = getServersFromDocument(undefined)
      expect(result).toEqual([])
    })

    it('creates fallback server from window.location.origin when no servers provided', () => {
      const result = getServersFromDocument(undefined)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: 'https://example.com',
      })
    })

    it('creates fallback server from document URL when provided', () => {
      const result = getServersFromDocument(undefined, {
        documentUrl: 'https://api.example.com/docs/openapi.json',
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: 'https://api.example.com',
      })
    })

    it('prioritizes document URL over window.location.origin for fallback', () => {
      const result = getServersFromDocument(undefined, {
        documentUrl: 'https://api.example.com/docs/openapi.json',
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://api.example.com')
    })

    it('handles empty servers array', () => {
      const result = getServersFromDocument([])

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: 'https://example.com',
      })
    })

    it('handles invalid servers array (non-array)', () => {
      const result = getServersFromDocument('invalid' as any)

      expect(result).toHaveLength(0)
    })

    it('processes valid server objects', () => {
      const servers: ServerObject[] = [
        {
          url: 'https://api.example.com',
          description: 'Production API',
        },
        {
          url: 'https://staging-api.example.com',
          description: 'Staging API',
        },
      ]

      const result = getServersFromDocument(servers)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        url: 'https://api.example.com',
        description: 'Production API',
      })
      expect(result[1]).toMatchObject({
        url: 'https://staging-api.example.com',
        description: 'Staging API',
      })
    })

    it('resolves relative URLs using baseServerURL', () => {
      const servers: ServerObject[] = [{ url: '/api/v1' }, { url: '/api/v2' }]

      const result = getServersFromDocument(servers, {
        baseServerUrl: 'https://api.example.com',
      })

      expect(result).toHaveLength(2)
      expect(result[0]?.url).toBe('https://api.example.com/api/v1')
      expect(result[1]?.url).toBe('https://api.example.com/api/v2')
    })

    it('resolves relative URLs using document URL when baseServerURL not provided', () => {
      const servers: ServerObject[] = [{ url: '/api/v1' }]

      const result = getServersFromDocument(servers, {
        documentUrl: 'https://docs.example.com/openapi.json',
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://docs.example.com/api/v1')
    })

    it('resolves relative URLs using window.location.origin when no other base URL available', () => {
      const servers: ServerObject[] = [{ url: '/api/v1' }]

      const result = getServersFromDocument(servers)

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://example.com/api/v1')
    })

    it('leaves absolute URLs unchanged', () => {
      const servers: ServerObject[] = [{ url: 'https://api.example.com/v1' }, { url: 'http://localhost:3000' }]

      const result = getServersFromDocument(servers)

      expect(result).toHaveLength(2)
      expect(result[0]?.url).toBe('https://api.example.com/v1')
      expect(result[1]?.url).toBe('http://localhost:3000')
    })

    it('handles servers with variables', () => {
      const servers: ServerObject[] = [
        {
          url: 'https://{environment}.example.com',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'staging', 'dev'],
            },
          },
        },
      ]

      const result = getServersFromDocument(servers)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: 'https://{environment}.example.com',
        variables: {
          environment: {
            default: 'api',
            enum: ['api', 'staging', 'dev'],
          },
        },
      })
    })

    it('handles document URL with port', () => {
      const result = getServersFromDocument(undefined, {
        documentUrl: 'https://api.example.com:8080/docs/openapi.json',
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://api.example.com:8080')
    })

    it('handles invalid document URL gracefully', () => {
      const result = getServersFromDocument(undefined, {
        documentUrl: 'invalid-url',
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://example.com')
    })

    it('handles document URL with path but no protocol', () => {
      const result = getServersFromDocument(undefined, {
        documentUrl: '//api.example.com/docs/openapi.json',
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://example.com')
    })

    it('combines multiple base URL resolution strategies', () => {
      const servers: ServerObject[] = [{ url: '/api/v1' }, { url: '/api/v2' }]

      const result = getServersFromDocument(servers, {
        baseServerUrl: 'https://base.example.com',
        documentUrl: 'https://docs.example.com/openapi.json',
      })

      // Should use baseServerURL (highest priority)
      expect(result).toHaveLength(2)
      expect(result[0]?.url).toBe('https://base.example.com/api/v1')
      expect(result[1]?.url).toBe('https://base.example.com/api/v2')
    })

    it('handles servers with complex URL patterns', () => {
      const servers: ServerObject[] = [
        { url: 'https://api.example.com/v1/users' },
        { url: 'https://api.example.com/v1/posts' },
        { url: '/v1/comments' },
      ]

      const result = getServersFromDocument(servers, {
        baseServerUrl: 'https://api.example.com',
      })

      expect(result).toHaveLength(3)
      expect(result[0]?.url).toBe('https://api.example.com/v1/users')
      expect(result[1]?.url).toBe('https://api.example.com/v1/posts')
      expect(result[2]?.url).toBe('https://api.example.com/v1/comments')
    })

    it('preserves server descriptions and metadata', () => {
      const servers: ServerObject[] = [
        {
          url: 'https://api.example.com',
          description: 'Production API server',
        },
      ]

      const result = getServersFromDocument(servers)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: 'https://api.example.com',
        description: 'Production API server',
      })
    })

    it('handles edge case with null servers', () => {
      // @ts-expect-error testing null value
      const result = getServersFromDocument(null)

      expect(result).toHaveLength(1)
      expect(result[0]?.url).toBe('https://example.com')
    })
  })
})
