/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'

import { combineUrlAndPath, mergeSearchParams, mergeUrls } from './merge-urls'

describe('mergeSearchParams', () => {
  it('merges basic params from different sources', () => {
    const base = new URLSearchParams('a=1&b=2')
    const path = new URLSearchParams('c=3')
    const url = new URLSearchParams('d=4')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1&b=2&c=3&d=4')
  })

  it('later sources overwrite earlier ones completely', () => {
    const base = new URLSearchParams('a=1&b=2')
    const path = new URLSearchParams('b=3')
    const url = new URLSearchParams('b=4')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1&b=4')
  })

  it('preserves multiple values from the same source', () => {
    const base = new URLSearchParams('a=1&a=2')
    const path = new URLSearchParams('b=3&b=4')
    const url = new URLSearchParams('c=5&c=6')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1&a=2&b=3&b=4&c=5&c=6')
  })

  it('overwrites multiple values from earlier sources', () => {
    const base = new URLSearchParams('a=1&a=2')
    const path = new URLSearchParams('a=3&a=4')
    const url = new URLSearchParams()

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=3&a=4')
  })

  it('handles empty params', () => {
    const base = new URLSearchParams()
    const path = new URLSearchParams('a=1')
    const url = new URLSearchParams()

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1')
  })

  it('handles special characters correctly', () => {
    const base = new URLSearchParams('q=hello world')
    const path = new URLSearchParams('filter=type:123')
    const url = new URLSearchParams('special=@#$%')

    const result = mergeSearchParams(base, path, url)
    expect(decodeURIComponent(result.toString())).toBe('q=hello+world&filter=type:123&special=@#$%')
  })

  it('handles complex overwriting scenarios', () => {
    const base = new URLSearchParams('a=1&a=2&b=1&c=1')
    const path = new URLSearchParams('b=2&b=3&c=2')
    const url = new URLSearchParams('c=3&c=4')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1&a=2&b=2&b=3&c=3&c=4')
  })

  it('maintains order of parameters', () => {
    const base = new URLSearchParams('first=1&second=2')
    const path = new URLSearchParams('third=3')
    const url = new URLSearchParams('fourth=4')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('first=1&second=2&third=3&fourth=4')
  })

  it('handles boolean and numeric values', () => {
    const base = new URLSearchParams('bool=true&num=123')
    const path = new URLSearchParams('bool=false')
    const url = new URLSearchParams('num=456')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('bool=false&num=456')
  })

  it('handles null and undefined values', () => {
    const base = new URLSearchParams('a=null&b=undefined')
    const path = new URLSearchParams('a=value')
    const url = new URLSearchParams()

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=value&b=undefined')
  })

  it('handles empty string values', () => {
    const base = new URLSearchParams('a=&b=value')
    const path = new URLSearchParams('b=')
    const url = new URLSearchParams()

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=&b=')
  })

  describe('edge cases', () => {
    it('handles all empty params', () => {
      const result = mergeSearchParams(new URLSearchParams(), new URLSearchParams(), new URLSearchParams())
      expect(result.toString()).toBe('')
    })

    it('handles repeated overwrites', () => {
      const base = new URLSearchParams('a=1&a=2')
      const path = new URLSearchParams('a=3')
      const url = new URLSearchParams('a=4&a=5')

      const result = mergeSearchParams(base, path, url)
      expect(result.toString()).toBe('a=4&a=5')
    })

    it('preserves plus signs in values', () => {
      const base = new URLSearchParams('q=c++')
      const result = mergeSearchParams(base, new URLSearchParams(), new URLSearchParams())
      expect(result.toString()).toBe('q=c++')
    })
  })
})

describe('mergeUrls', () => {
  it('combines simple URL and path', () => {
    const result = mergeUrls('https://api.example.com', '/users')
    expect(result).toBe('https://api.example.com/users')
  })

  it('handles query parameters from base URL', () => {
    const result = mergeUrls('https://api.example.com?version=1', '/users')
    expect(result).toBe('https://api.example.com/users?version=1')
  })

  it('handles query parameters from path', () => {
    const result = mergeUrls('https://api.example.com', '/users?role=admin')
    expect(result).toBe('https://api.example.com/users?role=admin')
  })

  it('handles query parameters from urlParams', () => {
    const params = new URLSearchParams('token=123')
    const result = mergeUrls('https://api.example.com', '/users', params)
    expect(result).toBe('https://api.example.com/users?token=123')
  })

  it('merges query parameters from all sources', () => {
    const params = new URLSearchParams('token=123')
    const result = mergeUrls('https://api.example.com?version=1', '/users?role=admin', params)
    expect(result).toBe('https://api.example.com/users?version=1&role=admin&token=123')
  })

  it('handles multiple values for same parameter', () => {
    const params = new URLSearchParams([
      ['filter', 'active'],
      ['filter', 'verified'],
    ])
    const result = mergeUrls('https://api.example.com', '/users', params)
    expect(result).toBe('https://api.example.com/users?filter=active&filter=verified')
  })

  it('later sources overwrite earlier ones', () => {
    const params = new URLSearchParams('version=3')
    const result = mergeUrls('https://api.example.com?version=1', '/users?version=2', params)
    expect(result).toBe('https://api.example.com/users?version=3')
  })

  it('handles URLs with template variables', () => {
    const result = mergeUrls('{protocol}://api.example.com', '/users')
    expect(result).toBe('http://localhost:3000/{protocol}://api.example.com/users')
  })

  it('handles URLs with template variables and disableOriginPrefix', () => {
    const result = mergeUrls('{protocol}://api.example.com', '/users', undefined, true)
    expect(result).toBe('{protocol}://api.example.com/users')
  })

  it('handles relative URLs', () => {
    const result = mergeUrls('/api', '/users')
    expect(result).toBe('http://localhost:3000/api/users')
  })
  it('handles relative URLs with disableOriginPrefix', () => {
    const result = mergeUrls('/api', '/users', undefined, true)
    expect(result).toBe('/api/users')
  })

  describe('path handling', () => {
    it('handles trailing slashes in base URL', () => {
      const result = mergeUrls('https://api.example.com/', '/users')
      expect(result).toBe('https://api.example.com/users')
    })

    it('handles leading slashes in path', () => {
      const result = mergeUrls('https://api.example.com', 'users')
      expect(result).toBe('https://api.example.com/users')
    })

    it('handles both trailing and leading slashes', () => {
      const result = mergeUrls('https://api.example.com/', '/users/')
      expect(result).toBe('https://api.example.com/users/')
    })

    it('handles empty path', () => {
      const result = mergeUrls('https://api.example.com', '')
      expect(result).toBe('https://api.example.com')
    })
  })

  describe('query parameter handling', () => {
    it('preserves parameter order', () => {
      const params = new URLSearchParams([
        ['c', '3'],
        ['d', '4'],
      ])
      const result = mergeUrls('https://api.example.com?a=1', '/users?b=2', params)
      expect(result).toBe('https://api.example.com/users?a=1&b=2&c=3&d=4')
    })

    it('handles special characters in parameters', () => {
      const params = new URLSearchParams([['q', 'hello world&special=true']])
      const result = mergeUrls('https://api.example.com', '/search', params)
      expect(result).toBe('https://api.example.com/search?q=hello+world%26special%3Dtrue')
    })

    it('handles empty parameters', () => {
      const params = new URLSearchParams('empty=')
      const result = mergeUrls('https://api.example.com', '/users', params)
      expect(result).toBe('https://api.example.com/users?empty=')
    })

    it('handles null or undefined parameters', () => {
      const params = new URLSearchParams([
        ['null', 'null'],
        ['undefined', 'undefined'],
      ])
      const result = mergeUrls('https://api.example.com', '/users', params)
      expect(result).toBe('https://api.example.com/users?null=null&undefined=undefined')
    })
  })

  describe('edge cases', () => {
    it('handles invalid URLs gracefully', () => {
      const result = mergeUrls('not-a-url', '/path')
      expect(result).toBe('http://localhost:3000/not-a-url/path')
    })

    it('handles invalid URLs with disableOriginPrefix', () => {
      const result = mergeUrls('not-a-url', '/path', undefined, true)
      expect(result).toBe('not-a-url/path')
    })

    it('handles URLs with authentication', () => {
      const result = mergeUrls('https://user:pass@api.example.com', '/users')
      expect(result).toBe('https://user:pass@api.example.com/users')
    })

    it('handles URLs with ports', () => {
      const result = mergeUrls('https://api.example.com:8080', '/users')
      expect(result).toBe('https://api.example.com:8080/users')
    })

    it('handles complex URLs', () => {
      const params = new URLSearchParams('token=123')
      const result = mergeUrls('https://user:pass@api.example.com:8080?version=1', '/users?role=admin', params)
      expect(result).toBe('https://user:pass@api.example.com:8080/users?version=1&role=admin&token=123')
    })
  })

  describe('error handling', () => {
    it('handles empty base url', () => {
      const result = mergeUrls('', '/users')
      expect(result).toBe('/users')
    })

    it('handles undefined urlParams', () => {
      const result = mergeUrls('https://api.example.com', '/users', undefined)
      expect(result).toBe('https://api.example.com/users')
    })

    it('handles malformed URLs gracefully', () => {
      const result = mergeUrls('http://{bad-url}', '/users')
      expect(result).toBe('http://{bad-url}/users')
    })
  })
})

describe('combineUrlAndPath', () => {
  describe('basic path joining', () => {
    it('combines base and path with single slash', () => {
      expect(combineUrlAndPath('http://example.com', 'api')).toBe('http://example.com/api')
    })

    it('returns base when paths are identical', () => {
      expect(combineUrlAndPath('http://example.com', 'http://example.com')).toBe('http://example.com')
    })

    it('returns base when path is empty', () => {
      expect(combineUrlAndPath('http://example.com', '')).toBe('http://example.com')
    })

    it('returns base when path is undefined', () => {
      expect(combineUrlAndPath('http://example.com', undefined as unknown as string)).toBe('http://example.com')
    })
  })

  describe('slash handling', () => {
    it('removes trailing slash from base', () => {
      expect(combineUrlAndPath('http://example.com/', 'api')).toBe('http://example.com/api')
    })

    it('removes leading slash from path', () => {
      expect(combineUrlAndPath('http://example.com', '/api')).toBe('http://example.com/api')
    })

    it('handles both trailing and leading slashes', () => {
      expect(combineUrlAndPath('http://example.com/', '/api')).toBe('http://example.com/api')
    })

    it('removes multiple trailing slashes', () => {
      expect(combineUrlAndPath('http://example.com///', 'api')).toBe('http://example.com/api')
    })

    it('removes multiple leading slashes', () => {
      expect(combineUrlAndPath('http://example.com', '///api')).toBe('http://example.com/api')
    })

    it('handles multiple slashes in both base and path', () => {
      expect(combineUrlAndPath('http://example.com///', '///api')).toBe('http://example.com/api')
    })
  })

  describe('path segments', () => {
    it('preserves multiple path segments', () => {
      expect(combineUrlAndPath('http://example.com', 'api/v1/users')).toBe('http://example.com/api/v1/users')
    })

    it('preserves query parameters in base', () => {
      expect(combineUrlAndPath('http://example.com?version=1', 'api')).toBe('http://example.com?version=1/api')
    })

    it('preserves query parameters in path', () => {
      expect(combineUrlAndPath('http://example.com', 'api?version=1')).toBe('http://example.com/api?version=1')
    })

    it('preserves hash fragments', () => {
      expect(combineUrlAndPath('http://example.com#section', 'api')).toBe('http://example.com#section/api')
    })
  })

  describe('special cases', () => {
    it('handles relative base paths', () => {
      expect(combineUrlAndPath('./base', 'api')).toBe('./base/api')
    })

    it('handles parent directory references', () => {
      expect(combineUrlAndPath('../base', 'api')).toBe('../base/api')
    })

    it('handles absolute paths', () => {
      expect(combineUrlAndPath('/base', 'api')).toBe('/base/api')
    })

    it('removes extra spaces', () => {
      expect(combineUrlAndPath('http://example.com ', '  api  ')).toBe('http://example.com/api')
    })

    it('handles URLs with ports', () => {
      expect(combineUrlAndPath('http://example.com:8080', 'api')).toBe('http://example.com:8080/api')
    })

    it('handles URLs with authentication', () => {
      expect(combineUrlAndPath('http://user:pass@example.com', 'api')).toBe('http://user:pass@example.com/api')
    })
  })

  describe('template variables', () => {
    it('preserves variables in base', () => {
      expect(combineUrlAndPath('{protocol}://example.com', 'api')).toBe('{protocol}://example.com/api')
    })

    it('preserves variables in path', () => {
      expect(combineUrlAndPath('http://example.com', '{version}/api')).toBe('http://example.com/{version}/api')
    })

    it('preserves variables in both', () => {
      expect(combineUrlAndPath('{host}/base', '{version}/api')).toBe('{host}/base/{version}/api')
    })
  })

  describe('edge cases', () => {
    it('handles empty base', () => {
      expect(combineUrlAndPath('', 'api')).toBe('api')
    })

    it('handles no base url', () => {
      expect(combineUrlAndPath('', 'https://example.com/api')).toBe('https://example.com/api')
    })

    it('handles both empty strings', () => {
      expect(combineUrlAndPath('', '')).toBe('')
    })

    it('handles root paths', () => {
      expect(combineUrlAndPath('http://example.com', '/')).toBe('http://example.com/')
    })

    it('handles special characters in paths', () => {
      expect(combineUrlAndPath('http://example.com', 'path with spaces')).toBe('http://example.com/path with spaces')
    })

    it('preserves URL encoded characters', () => {
      expect(combineUrlAndPath('http://example.com', 'path%20with%20spaces')).toBe(
        'http://example.com/path%20with%20spaces',
      )
    })
  })
})
