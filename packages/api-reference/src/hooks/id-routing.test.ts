import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getIdFromHash, getIdFromPath, makeUrlFromId, sanitizeBasePath } from './id-routing'

describe('sanitizeBasePath', () => {
  it('removes leading and trailing slashes', () => {
    expect(sanitizeBasePath('/my/api/')).toBe('my/api')
  })

  it('removes only leading slashes', () => {
    expect(sanitizeBasePath('/my/api')).toBe('my/api')
  })

  it('removes only trailing slashes', () => {
    expect(sanitizeBasePath('my/api/')).toBe('my/api')
  })

  it('handles paths without slashes', () => {
    expect(sanitizeBasePath('my/api')).toBe('my/api')
  })

  it('removes multiple leading slashes', () => {
    expect(sanitizeBasePath('///my/api')).toBe('my/api')
  })

  it('removes multiple trailing slashes', () => {
    expect(sanitizeBasePath('my/api///')).toBe('my/api')
  })

  it('removes multiple leading and trailing slashes', () => {
    expect(sanitizeBasePath('///my/api///')).toBe('my/api')
  })

  it('handles empty string', () => {
    expect(sanitizeBasePath('')).toBe('')
  })

  it('handles only slashes', () => {
    expect(sanitizeBasePath('///')).toBe('')
  })

  it('preserves internal slashes', () => {
    expect(sanitizeBasePath('/my/nested/api/path/')).toBe('my/nested/api/path')
  })
})

describe('getIdFromHash', () => {
  it('Should get the id from a basic hashed URL', () => {
    const url = new URL('https://example.com/#tag/meeting')

    expect(getIdFromHash(url)).toBe('tag/meeting')
  })

  it('Should handle encoding special characters in the id', () => {
    const url = new URL('https://example.com/#tag/meeting with friends')
    // Special characters are encoded in the hash
    expect(url.hash).toContain(encodeURIComponent('meeting with friends'))

    expect(getIdFromHash(url)).toBe('tag/meeting with friends')
  })

  it('Should handle sub paths in the id', () => {
    const url = new URL('https://example.com/my/api#tag/meeting/sub-path')
    expect(getIdFromHash(url)).toBe('tag/meeting/sub-path')
  })
})

describe('getIdFromPath', () => {
  it('extracts the id from a basic path', () => {
    const url = new URL('https://example.com/my/api/tag/meeting')
    expect(getIdFromPath(url, '/my/api')).toBe('tag/meeting')
  })

  it('handles special characters in the base path and path', () => {
    const url = new URL('https://example.com/my/good api/tag/meeting with friends')
    expect(getIdFromPath(url, '/my/good api')).toBe('tag/meeting with friends')
  })

  it('handles basePath with both leading and trailing slashes', () => {
    const url = new URL('https://example.com/my/api/tag/users')
    expect(getIdFromPath(url, '/my/api/')).toBe('tag/users')
  })

  it('handles empty basePath', () => {
    const url = new URL('https://example.com/tag/meeting')
    expect(getIdFromPath(url, '')).toBe('tag/meeting')
  })

  it('handles basePath with only slashes', () => {
    const url = new URL('https://example.com/tag/meeting')
    expect(getIdFromPath(url, '///')).toBe('tag/meeting')
  })

  it('returns empty string when URL only contains basePath', () => {
    const url = new URL('https://example.com/my/api')
    expect(getIdFromPath(url, '/my/api/')).toBe('')
  })

  it('returns empty string when URL only contains basePath with trailing slash', () => {
    const url = new URL('https://example.com/my/api/')
    expect(getIdFromPath(url, '/my/api')).toBe('')
  })

  it('handles multiple path segments after basePath', () => {
    const url = new URL('https://example.com/api/v1/tag/users/list/active')
    expect(getIdFromPath(url, '/api/v1')).toBe('tag/users/list/active')
  })

  it('handles special characters in the ID portion', () => {
    const url = new URL('https://example.com/api/tag/user-profile@$')
    expect(getIdFromPath(url, '/api')).toBe('tag/user-profile@$')
  })

  it('handles URL-encoded characters in the ID', () => {
    const url = new URL('https://example.com/api/tag/hello%20world')
    expect(getIdFromPath(url, '/api')).toBe('tag/hello world')
  })

  it('ignores query parameters', () => {
    const url = new URL('https://example.com/api/tag/meeting?page=1&limit=10')
    expect(getIdFromPath(url, '/api')).toBe('tag/meeting')
  })

  it('ignores hash fragments', () => {
    const url = new URL('https://example.com/api/tag/meeting#section')
    expect(getIdFromPath(url, '/api')).toBe('tag/meeting')
  })

  it('returns empty string when basePath does not match', () => {
    const url = new URL('https://example.com/other/path/tag/meeting')
    expect(getIdFromPath(url, '/my/api')).toBe('')
  })

  it('handles nested basePath', () => {
    const url = new URL('https://example.com/docs/api/v2/reference/tag/auth')
    expect(getIdFromPath(url, '/docs/api/v2/reference')).toBe('tag/auth')
  })

  it('handles basePath with numbers', () => {
    const url = new URL('https://example.com/api/v1/tag/users')
    expect(getIdFromPath(url, '/api/v1')).toBe('tag/users')
  })

  it('handles basePath with hyphens and underscores', () => {
    const url = new URL('https://example.com/my-api_v2/tag/users')
    expect(getIdFromPath(url, '/my-api_v2')).toBe('tag/users')
  })

  it('handles percent-encoded characters in basePath', () => {
    const url = new URL('https://example.com/my%20api/tag/meeting')
    expect(getIdFromPath(url, '/my api')).toBe('tag/meeting')
  })

  it('handles complex special characters', () => {
    const url = new URL('https://example.com/api/tag/user@example.com')
    expect(getIdFromPath(url, '/api')).toBe('tag/user@example.com')
  })

  it('handles single segment after basePath', () => {
    const url = new URL('https://example.com/api/users')
    expect(getIdFromPath(url, '/api')).toBe('users')
  })

  it('handles root basePath', () => {
    const url = new URL('https://example.com/tag/meeting')
    expect(getIdFromPath(url, '')).toBe('tag/meeting')
    expect(getIdFromPath(url, '/')).toBe('tag/meeting')
  })
})

describe('makeUrlFromId', () => {
  const originalWindow = global.window

  beforeEach(() => {
    // Mock window.location for each test
    global.window = {
      location: {
        href: 'https://example.com/current/path',
      },
    } as any
  })

  afterEach(() => {
    // Restore original window
    global.window = originalWindow
  })

  // Hash routing
  it('sets the hash when basePath is undefined', () => {
    const result = makeUrlFromId('tag/meeting', undefined)
    expect(result?.hash).toBe('#tag/meeting')
    expect(result?.href).toBe('https://example.com/current/path#tag/meeting')
  })

  it('replaces existing hash', () => {
    global.window.location.href = 'https://example.com/current/path#old-hash'
    const result = makeUrlFromId('tag/users', undefined)
    expect(result?.hash).toBe('#tag/users')
  })

  it('handles IDs with special characters', () => {
    const result = makeUrlFromId('tag/meeting with friends', undefined)
    expect(result?.hash).toBe('#tag/meeting%20with%20friends')
    expect(getIdFromHash(result as URL)).toBe('tag/meeting with friends')
  })

  it('handles empty ID', () => {
    const result = makeUrlFromId('', undefined)
    expect(result?.hash).toBe('')
  })

  it('handles complex IDs with multiple segments', () => {
    const result = makeUrlFromId('tag/users/list/active', undefined)
    expect(result?.hash).toBe('#tag/users/list/active')
  })

  it('preserves query parameters', () => {
    global.window.location.href = 'https://example.com/path?page=1&limit=10'
    const result = makeUrlFromId('tag/meeting', undefined)
    expect(result?.search).toBe('?page=1&limit=10')
    expect(result?.hash).toBe('#tag/meeting')
  })

  // Path routing
  it('sets the pathname with a basic basePath', () => {
    const result = makeUrlFromId('tag/meeting', '/api')
    expect(result?.pathname).toBe('/api/tag/meeting')
  })

  it('handles basePath with leading slash', () => {
    const result = makeUrlFromId('tag/users', '/my/api')
    expect(result?.pathname).toBe('/my/api/tag/users')
  })

  it('handles basePath without leading slash', () => {
    const result = makeUrlFromId('tag/users', 'my/api')
    expect(result?.pathname).toBe('/my/api/tag/users')
  })

  it('handles basePath with trailing slash', () => {
    const result = makeUrlFromId('tag/users', '/my/api/')
    expect(result?.pathname).toBe('/my/api/tag/users')
  })

  it('handles basePath with both leading and trailing slashes', () => {
    const result = makeUrlFromId('tag/users', '/my/api/')
    expect(result?.pathname).toBe('/my/api/tag/users')
  })

  it('handles empty basePath', () => {
    const result = makeUrlFromId('tag/meeting', '')
    expect(result?.pathname).toBe('/tag/meeting')
  })

  it('handles basePath with only slashes', () => {
    const result = makeUrlFromId('tag/meeting', '///')
    expect(result?.pathname).toBe('/tag/meeting')
  })

  it('handles nested basePath', () => {
    const result = makeUrlFromId('tag/auth', '/docs/api/v2/reference')
    expect(result?.pathname).toBe('/docs/api/v2/reference/tag/auth')
  })

  it('handles basePath with special characters', () => {
    const result = makeUrlFromId('tag/meeting', '/my api')
    // URL objects automatically encode special characters in pathname
    expect(result?.pathname).toBe('/my%20api/tag/meeting')
  })

  it('handles ID with special characters', () => {
    const result = makeUrlFromId('tag/user-profile@$', '/api')
    expect(result?.pathname).toBe('/api/tag/user-profile@$')
  })

  it('handles empty ID', () => {
    const result = makeUrlFromId('', '/api')
    expect(result?.pathname).toBe('/api/')
  })

  it('handles multiple path segments in ID', () => {
    const result = makeUrlFromId('tag/users/list/active', '/api/v1')
    expect(result?.pathname).toBe('/api/v1/tag/users/list/active')
  })

  it('handles single segment ID', () => {
    const result = makeUrlFromId('users', '/api')
    expect(result?.pathname).toBe('/api/users')
  })

  it('preserves query parameters', () => {
    global.window.location.href = 'https://example.com/old/path?page=1&limit=10'
    const result = makeUrlFromId('tag/meeting', '/api')
    expect(result?.search).toBe('?page=1&limit=10')
    expect(result?.pathname).toBe('/api/tag/meeting')
  })

  it('preserves existing hash when switching to path routing', () => {
    global.window.location.href = 'https://example.com/old/path#old-hash'
    const result = makeUrlFromId('tag/meeting', '/api')
    // Hash is preserved from the original URL unless explicitly cleared
    expect(result?.hash).toBe('#old-hash')
    expect(result?.pathname).toBe('/api/tag/meeting')
  })

  it('preserves host and protocol', () => {
    global.window.location.href = 'https://example.com:8080/old/path'
    const result = makeUrlFromId('tag/meeting', '/api')
    expect(result?.hostname).toBe('example.com')
    expect(result?.port).toBe('8080')
    expect(result?.protocol).toBe('https:')
  })

  it('handles basePath with numbers', () => {
    const result = makeUrlFromId('tag/users', '/api/v1')
    expect(result?.pathname).toBe('/api/v1/tag/users')
  })

  it('handles basePath with hyphens and underscores', () => {
    const result = makeUrlFromId('tag/users', '/my-api_v2')
    expect(result?.pathname).toBe('/my-api_v2/tag/users')
  })

  // Server-side behavior
  it('returns undefined when window is not defined', () => {
    global.window = undefined as any
    const result = makeUrlFromId('tag/meeting', '/api')
    expect(result).toBeUndefined()
  })

  it('returns undefined for hash routing when window is not defined', () => {
    global.window = undefined as any
    const result = makeUrlFromId('tag/meeting', undefined)
    expect(result).toBeUndefined()
  })

  // Edge cases
  it('handles ID with leading slash', () => {
    const result = makeUrlFromId('/tag/meeting', '/api')
    expect(result?.pathname).toBe('/api//tag/meeting')
  })

  it('handles different window locations', () => {
    global.window.location.href = 'https://different-domain.com/some/path'
    const result = makeUrlFromId('tag/meeting', '/api')
    expect(result?.hostname).toBe('different-domain.com')
    expect(result?.pathname).toBe('/api/tag/meeting')
  })

  it('handles URL with authentication', () => {
    global.window.location.href = 'https://user:pass@example.com/path'
    const result = makeUrlFromId('tag/meeting', '/api')
    expect(result?.username).toBe('user')
    expect(result?.password).toBe('pass')
    expect(result?.pathname).toBe('/api/tag/meeting')
  })

  it('handles complex query strings', () => {
    global.window.location.href = 'https://example.com/path?filter[status]=active&sort=-created'
    const result = makeUrlFromId('tag/users', '/api')
    expect(result?.search).toBe('?filter[status]=active&sort=-created')
  })

  it('handles root path basePath', () => {
    const result = makeUrlFromId('tag/meeting', '/')
    expect(result?.pathname).toBe('/tag/meeting')
  })
})
