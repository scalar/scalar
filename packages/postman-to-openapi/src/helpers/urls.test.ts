import { describe, expect, it } from 'vitest'

import {
  createCollectionVariableLookup,
  extractPathFromUrl,
  extractPathParameterNames,
  extractServerObjectFromUrl,
  extractServerFromUrl,
  getPathStructuralSignature,
  getDomainFromUrl,
  normalizePath,
} from './urls'

describe('urls', () => {
  it('extracts domain with port when present', () => {
    expect(getDomainFromUrl('https://example.com:8080/users')).toBe('https://example.com:8080')
  })

  it('extracts domain without port', () => {
    expect(getDomainFromUrl('http://api.scalar.com/path')).toBe('http://api.scalar.com')
  })

  it('returns root path when url is missing', () => {
    expect(extractPathFromUrl(undefined)).toBe('/')
  })

  it('strips domain, query, and hash while normalizing Postman variables', () => {
    expect(extractPathFromUrl('https://example.com//users/{{userId}}/posts?draft=true#section')).toBe(
      '/users/{userId}/posts',
    )
  })

  it('collapses duplicate slashes in the path', () => {
    expect(extractPathFromUrl('http://example.com///users//posts')).toBe('/users/posts')
  })

  it('converts colon parameters to curly braces', () => {
    expect(normalizePath('/users/:userId/posts/:postId')).toBe('/users/{userId}/posts/{postId}')
  })

  it('generates matching structural signatures for paths that differ by parameter names', () => {
    expect(getPathStructuralSignature('/applications/{applicationId}')).toBe('/applications/{*}')
    expect(getPathStructuralSignature('/applications/{fakeAppId}')).toBe('/applications/{*}')
    expect(getPathStructuralSignature('/applications/:id')).toBe('/applications/{*}')
  })

  it('keeps literal segments in structural signatures', () => {
    expect(getPathStructuralSignature('/applications/{id}/logs/{logId}')).toBe('/applications/{*}/logs/{*}')
    expect(getPathStructuralSignature('/applications/active')).toBe('/applications/active')
  })

  it('extracts double curly brace parameters', () => {
    expect(extractPathParameterNames('/users/{{userId}}/posts/{{postId}}')).toEqual(['userId', 'postId'])
  })

  it('extracts single curly brace parameters', () => {
    expect(extractPathParameterNames('/users/{userId}/posts/{postId}')).toEqual(['userId', 'postId'])
  })

  it('extracts colon parameters', () => {
    expect(extractPathParameterNames('/users/:userId/posts/:postId')).toEqual(['userId', 'postId'])
  })

  it('deduplicates repeated parameters', () => {
    expect(extractPathParameterNames('/users/:id/posts/:id')).toEqual(['id'])
  })

  it('handles empty string URL', () => {
    expect(extractPathFromUrl('')).toBe('/')
  })

  it('handles URL with only domain', () => {
    expect(extractPathFromUrl('https://example.com')).toBe('/')
  })

  it('handles URL with only root path', () => {
    expect(extractPathFromUrl('https://example.com/')).toBe('/')
  })

  it('handles path with multiple consecutive slashes', () => {
    expect(extractPathFromUrl('https://example.com///users///posts')).toBe('/users/posts')
  })

  it('handles path with mixed parameter formats', () => {
    expect(extractPathParameterNames('/users/{{userId}}/posts/:postId/comments/{commentId}')).toEqual([
      'userId',
      'postId',
      'commentId',
    ])
  })

  it('handles empty path', () => {
    expect(normalizePath('')).toBe('')
  })

  it('handles path without parameters', () => {
    expect(normalizePath('/users/posts')).toBe('/users/posts')
  })

  it('removes default HTTP port', () => {
    // URL constructor removes default ports
    expect(getDomainFromUrl('http://example.com:80/path')).toBe('http://example.com')
  })

  it('removes default HTTPS port', () => {
    // URL constructor removes default ports
    expect(getDomainFromUrl('https://example.com:443/path')).toBe('https://example.com')
  })

  describe('extractServerFromUrl', () => {
    it('preserves HTTP protocol', () => {
      expect(extractServerFromUrl('http://api.example.com/users')).toBe('http://api.example.com')
    })

    it('preserves HTTPS protocol', () => {
      expect(extractServerFromUrl('https://api.example.com/users')).toBe('https://api.example.com')
    })

    it('defaults to HTTPS when protocol is missing', () => {
      expect(extractServerFromUrl('api.example.com/users')).toBe('https://api.example.com')
    })

    it('preserves HTTP protocol with port', () => {
      expect(extractServerFromUrl('http://api.example.com:8080/users')).toBe('http://api.example.com:8080')
    })

    it('preserves HTTPS protocol with port', () => {
      expect(extractServerFromUrl('https://api.example.com:8443/users')).toBe('https://api.example.com:8443')
    })

    it('removes trailing slash', () => {
      expect(extractServerFromUrl('http://api.example.com/')).toBe('http://api.example.com')
    })

    it('strips query parameters and hash', () => {
      expect(extractServerFromUrl('http://api.example.com/users?page=1#section')).toBe('http://api.example.com')
    })

    it('returns undefined for empty string', () => {
      expect(extractServerFromUrl('')).toBeUndefined()
    })

    it('returns undefined for undefined input', () => {
      expect(extractServerFromUrl(undefined)).toBeUndefined()
    })

    it('handles URL with only domain', () => {
      expect(extractServerFromUrl('http://example.com')).toBe('http://example.com')
    })

    it('resolves host fragment variables from collection variables', () => {
      const lookup = createCollectionVariableLookup([{ key: 'url-languagesAPI', value: 'localhost:3005' }])

      expect(extractServerObjectFromUrl('https://{{url-languagesAPI}}/v1/languages', lookup)).toEqual({
        url: 'https://localhost:3005',
      })
    })

    it('resolves complete URL variables when template is the full host', () => {
      const lookup = createCollectionVariableLookup([{ key: 'url-applicationAPI', value: 'https://app.example.com' }])

      expect(extractServerObjectFromUrl('https://{{url-applicationAPI}}/users', lookup)).toEqual({
        url: 'https://app.example.com',
      })
    })

    it('rewrites unresolved variables to OpenAPI server variables', () => {
      expect(extractServerObjectFromUrl('https://{{url-notificationAPI}}/events')).toEqual({
        url: 'https://{url-notificationAPI}',
        variables: {
          'url-notificationAPI': {
            default: 'example.com',
            description: 'Declared in Postman collection variables.',
          },
        },
      })
    })

    it('falls back to OpenAPI variables when value is recursive template syntax', () => {
      const lookup = createCollectionVariableLookup([{ key: 'url-exampleAPI', value: '{{url-local}}' }])

      expect(extractServerObjectFromUrl('https://{{url-exampleAPI}}/status', lookup)).toEqual({
        url: 'https://{url-exampleAPI}',
        variables: {
          'url-exampleAPI': {
            default: 'example.com',
            description: 'Declared in Postman collection variables.',
          },
        },
      })
    })
  })
})
