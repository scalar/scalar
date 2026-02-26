import { cwd } from 'node:process'

import { describe, expect, it } from 'vitest'

import { resolveReferencePath } from '@/helpers/resolve-reference-path'

describe('resolveReferencePath', () => {
  describe('remote URLs with relative paths', () => {
    it('resolves relative path in the same directory', () => {
      const base = 'https://example.com/api/schema.json'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/api/user.json')
    })

    it('resolves relative path in a subdirectory', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/api/schemas/user.json')
    })

    it('resolves relative path with ../ going to parent directory', () => {
      const base = 'https://example.com/api/v1/openapi.json'
      const relativePath = '../schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/api/schemas/user.json')
    })

    it('resolves relative path with multiple ../ levels', () => {
      const base = 'https://example.com/api/v1/docs/openapi.json'
      const relativePath = '../../schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/api/schemas/user.json')
    })

    it('resolves deeply nested relative paths', () => {
      const base = 'https://example.com/openapi.json'
      const relativePath = 'schemas/entities/user/profile.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/schemas/entities/user/profile.json')
    })

    it('resolves relative path starting with ./', () => {
      const base = 'https://example.com/api/schema.json'
      const relativePath = './user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/api/user.json')
    })

    it('resolves path at root level', () => {
      const base = 'https://example.com/openapi.json'
      const relativePath = 'schema.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/schema.json')
    })
  })

  describe('remote URLs with absolute paths', () => {
    it('resolves absolute path starting with /', () => {
      const base = 'https://example.com/api/v1/openapi.json'
      const relativePath = '/schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/schemas/user.json')
    })

    it('resolves absolute path replacing base pathname entirely', () => {
      const base = 'https://example.com/deeply/nested/path/openapi.json'
      const relativePath = '/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/user.json')
    })
  })

  describe('when relativePath is already a full URL', () => {
    it('returns the relativePath unchanged when it is a complete URL', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'https://other.com/schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://other.com/schemas/user.json')
    })

    it('returns the relativePath unchanged when it uses http protocol', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'http://other.com/schema.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('http://other.com/schema.json')
    })

    it('returns the relativePath unchanged when it is same origin', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'https://example.com/other/schema.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/other/schema.json')
    })
  })

  describe('remote URLs with query parameters and fragments', () => {
    it('preserves query parameters in base URL', () => {
      const base = 'https://example.com/api/openapi.json?version=v1'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      // Query parameters should be preserved in the base URL structure
      expect(result).toContain('https://example.com/api/user.json')
    })

    it('preserves hash fragments in base URL', () => {
      const base = 'https://example.com/api/openapi.json#section'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      // Hash should be preserved in the base URL structure
      expect(result).toContain('https://example.com/api/user.json')
    })

    it('handles relative path with query parameters (gets URL-encoded)', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'user.json?version=v1'
      const result = resolveReferencePath(base, relativePath)
      // Query parameters in relativePath are treated as part of the pathname and get encoded
      expect(result).toBe('https://example.com/api/user.json%3Fversion=v1')
    })

    it('handles relative path with hash fragment (gets URL-encoded)', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'user.json#UserSchema'
      const result = resolveReferencePath(base, relativePath)
      // Hash fragments in relativePath are treated as part of the pathname and get encoded
      expect(result).toBe('https://example.com/api/user.json%23UserSchema')
    })
  })

  describe('remote URLs with different protocols and ports', () => {
    it('maintains the protocol from the base URL', () => {
      const base = 'http://example.com/api/openapi.json'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('http://example.com/api/user.json')
    })

    it('maintains the port from the base URL', () => {
      const base = 'https://example.com:8443/api/openapi.json'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com:8443/api/user.json')
    })

    it('maintains custom port and https protocol', () => {
      const base = 'https://localhost:3000/api/openapi.json'
      const relativePath = 'schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://localhost:3000/api/schemas/user.json')
    })
  })

  describe('file paths', () => {
    it('resolves relative path for local files in same directory', () => {
      const base = '/path/to/openapi.json'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('/path/to/user.json')
    })

    it('resolves relative path for local files in subdirectory', () => {
      const base = '/path/to/openapi.json'
      const relativePath = 'schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('/path/to/schemas/user.json')
    })

    it('resolves relative path with ../ for local files', () => {
      const base = '/path/to/api/openapi.json'
      const relativePath = '../schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('/path/to/schemas/user.json')
    })

    it('resolves deeply nested file paths', () => {
      const base = '/project/api/v1/openapi.json'
      const relativePath = '../../schemas/user/profile.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('/project/schemas/user/profile.json')
    })

    it('handles relative base paths', () => {
      const base = './api/openapi.json'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      // Should resolve relative to current working directory
      expect(result).toBeTruthy()
      expect(result).toContain('user.json')
    })

    it('handles Windows-style paths', () => {
      const base = 'C:\\projects\\api\\openapi.json'
      const relativePath = 'schemas\\user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('handles empty relative path', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = ''
      const result = resolveReferencePath(base, relativePath)
      // Empty relative path should resolve to the base directory
      expect(result).toContain('https://example.com/api')
    })

    it('handles URL with trailing slash in base', () => {
      const base = 'https://example.com/api/'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toContain('user.json')
    })

    it('handles encoded characters in URL', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'user%20schema.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/api/user%20schema.json')
    })

    it('handles special characters in path', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'schemas/user-profile_v2.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('https://example.com/api/schemas/user-profile_v2.json')
    })

    it('handles excessive ../ that go beyond root', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = '../../../user.json'
      const result = resolveReferencePath(base, relativePath)
      // Should resolve to root level without error
      expect(result).toContain('https://example.com')
      expect(result).toContain('user.json')
    })

    it('handles localhost URLs', () => {
      const base = 'http://localhost/api/openapi.json'
      const relativePath = 'schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('http://localhost/api/schemas/user.json')
    })

    it('handles IP address URLs', () => {
      const base = 'http://192.168.1.1/api/openapi.json'
      const relativePath = 'user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('http://192.168.1.1/api/user.json')
    })

    it('handles base directories', () => {
      const base = '/Users/someone/Desktop/Projects/my-project/packages/json-magic/test'
      const relativePath = './7d4f3a5d-dca9-4bb3-bb48-30da2bc43f18'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe(
        '/Users/someone/Desktop/Projects/my-project/packages/json-magic/7d4f3a5d-dca9-4bb3-bb48-30da2bc43f18',
      )
    })
  })

  describe('absolute relativePath scenarios', () => {
    it('returns absolute relativePath when base is absolute local path', () => {
      const base = '/project/api/openapi.json'
      const relativePath = '/schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('/schemas/user.json')
    })

    it('returns absolute relativePath when base is relative local path', () => {
      const base = './api/openapi.json'
      const relativePath = '/absolute/path/schema.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('/absolute/path/schema.json')
    })
  })

  describe('both paths are relative', () => {
    it('resolves two relative paths correctly', () => {
      const base = 'api/openapi.json'
      const relativePath = 'schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe(`${cwd()}/api/schemas/user.json`)
    })

    it('resolves relative paths with ../ navigation', () => {
      const base = 'api/v1/openapi.json'
      const relativePath = '../schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe(`${cwd()}/api/schemas/user.json`)
    })

    it('resolves relative paths with ./ prefix', () => {
      const base = 'api/openapi.json'
      const relativePath = './user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe(`${cwd()}/api/user.json`)
    })

    it('handles relative base with nested relative path', () => {
      const base = './openapi.json'
      const relativePath = 'schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe(`${cwd()}/schemas/user.json`)
    })

    it('handles multiple levels of ../ in relative paths', () => {
      const base = 'a/b/c/openapi.json'
      const relativePath = '../../../schemas/user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe(`${cwd()}/schemas/user.json`)
    })
  })

  describe('path normalization', () => {
    it('normalizes multiple consecutive slashes in relative path', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'schemas//user.json'
      const result = resolveReferencePath(base, relativePath)
      // Should normalize to single slash
      expect(result).toBeTruthy()
      expect(result).toContain('schemas')
      expect(result).toContain('user.json')
    })

    it('handles redundant ./ in middle of path', () => {
      const base = 'https://example.com/api/openapi.json'
      const relativePath = 'schemas/./user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBeTruthy()
      expect(result).toContain('user.json')
    })

    it('handles mixed ./ and ../ in path', () => {
      const base = 'https://example.com/api/v1/openapi.json'
      const relativePath = './../../schemas/./user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toContain('schemas')
      expect(result).toContain('user.json')
    })

    it('normalizes paths with only ./', () => {
      const base = '/path/to/openapi.json'
      const relativePath = './'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBeTruthy()
    })

    it('handles path with only ../', () => {
      const base = '/path/to/openapi.json'
      const relativePath = '../'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('/path')
    })

    it('handles windows style paths', () => {
      const base = 'C:\\path\\to\\openapi.json'
      const relativePath = 'schemas\\user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('C:/path/to/schemas/user.json')
    })

    it('handles windows style paths with multiple ../', () => {
      const base = 'C:\\path\\to\\openapi.json'
      const relativePath = '\\schemas\\user.json'
      const result = resolveReferencePath(base, relativePath)
      expect(result).toBe('/schemas/user.json')
    })
  })
})
