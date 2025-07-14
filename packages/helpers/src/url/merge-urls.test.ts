/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { mergeSearchParams, mergeUrls, combineUrlAndPath, injectApiKeyInPath } from './merge-urls'

describe('mergeSearchParams', () => {
  it('should merge basic params', () => {
    const base = new URLSearchParams('a=1&b=2')
    const path = new URLSearchParams('c=3')
    const url = new URLSearchParams('d=4')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1&b=2&c=3&d=4')
  })

  it('should overwrite params with later sources taking precedence', () => {
    const base = new URLSearchParams('a=1&b=2')
    const path = new URLSearchParams('b=3')
    const url = new URLSearchParams('b=4')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1&b=4')
  })

  it('should preserve multiple values for each key within a source', () => {
    const base = new URLSearchParams('a=1&a=2')
    const path = new URLSearchParams('b=3&b=4')
    const url = new URLSearchParams('c=5&c=6')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1&a=2&b=3&b=4&c=5&c=6')
  })

  it('should handle overwriting multiple values', () => {
    const base = new URLSearchParams('a=1&a=2')
    const path = new URLSearchParams('a=3&a=4')
    const url = new URLSearchParams()

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=3&a=4')
  })

  it('should handle empty params', () => {
    const base = new URLSearchParams()
    const path = new URLSearchParams('a=1')
    const url = new URLSearchParams()

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1')
  })

  it('should handle special characters in params', () => {
    const base = new URLSearchParams('q=hello world')
    const path = new URLSearchParams('filter=type:123')
    const url = new URLSearchParams('special=@#$%')

    const result = mergeSearchParams(base, path, url)
    expect(decodeURIComponent(result.toString())).toBe('q=hello+world&filter=type:123&special=@#$%')
  })

  it('should handle complex merge scenarios', () => {
    const base = new URLSearchParams('a=1&a=2&b=1&c=1')
    const path = new URLSearchParams('b=2&b=3&c=2')
    const url = new URLSearchParams('c=3&c=4')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=1&a=2&b=2&b=3&c=3&c=4')
  })

  it('should handle mixed single and multiple values', () => {
    const base = new URLSearchParams('first=1&second=2')
    const path = new URLSearchParams('third=3')
    const url = new URLSearchParams('fourth=4')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('first=1&second=2&third=3&fourth=4')
  })

  it('should handle value type coercion', () => {
    const base = new URLSearchParams('bool=true&num=123')
    const path = new URLSearchParams('bool=false')
    const url = new URLSearchParams('num=456')

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('bool=false&num=456')
  })

  it('should handle null and undefined like values', () => {
    const base = new URLSearchParams('a=null&b=undefined')
    const path = new URLSearchParams('a=value')
    const url = new URLSearchParams()

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=value&b=undefined')
  })

  it('should handle empty string values', () => {
    const base = new URLSearchParams('a=&b=value')
    const path = new URLSearchParams('b=')
    const url = new URLSearchParams()

    const result = mergeSearchParams(base, path, url)
    expect(result.toString()).toBe('a=&b=')
  })

  it('should return empty URLSearchParams when all inputs are empty', () => {
    const result = mergeSearchParams(new URLSearchParams(), new URLSearchParams(), new URLSearchParams())
    expect(result.toString()).toBe('')
  })

  it('should handle single source with multiple values', () => {
    const base = new URLSearchParams('a=1&a=2')
    const result = mergeSearchParams(base, new URLSearchParams(), new URLSearchParams())
    expect(result.toString()).toBe('a=1&a=2')
  })

  it('should handle complex character encoding', () => {
    const base = new URLSearchParams('q=c++')
    const result = mergeSearchParams(base, new URLSearchParams(), new URLSearchParams())
    expect(result.toString()).toBe('q=c%2B%2B')
  })
})

describe('combineUrlAndPath', () => {
  it('should combine basic URL and path', () => {
    expect(combineUrlAndPath('https://example.com', 'api/users')).toBe('https://example.com/api/users')
  })

  it('should handle trailing slash in URL', () => {
    expect(combineUrlAndPath('https://example.com/', 'api/users')).toBe('https://example.com/api/users')
  })

  it('should handle leading slash in path', () => {
    expect(combineUrlAndPath('https://example.com', '/api/users')).toBe('https://example.com/api/users')
  })

  it('should handle both trailing and leading slashes', () => {
    expect(combineUrlAndPath('https://example.com/', '/api/users')).toBe('https://example.com/api/users')
  })

  it('should return URL when path is empty', () => {
    expect(combineUrlAndPath('https://example.com', '')).toBe('https://example.com')
  })

  it('should return path when URL is empty', () => {
    expect(combineUrlAndPath('', 'api/users')).toBe('api/users')
  })

  it('should return URL when URL equals path', () => {
    expect(combineUrlAndPath('same', 'same')).toBe('same')
  })
})

describe('injectApiKeyInPath', () => {
  it('should inject API key between base URL and path', () => {
    const result = injectApiKeyInPath('https://api.example.com', 'testkey', '/users')
    expect(result).toBe('https://api.example.com/testkey/users')
  })

  it('should handle API key with special characters', () => {
    const result = injectApiKeyInPath('https://api.example.com', 'test:key@123', '/users')
    expect(result).toBe('https://api.example.com/test%3Akey%40123/users')
  })

  it('should handle empty API key by falling back to normal combination', () => {
    const result = injectApiKeyInPath('https://api.example.com', '', '/users')
    expect(result).toBe('https://api.example.com/users')
  })

  it('should handle whitespace-only API key', () => {
    const result = injectApiKeyInPath('https://api.example.com', '   ', '/users')
    expect(result).toBe('https://api.example.com/users')
  })

  it('should trim whitespace from API key', () => {
    const result = injectApiKeyInPath('https://api.example.com', '  testkey  ', '/users')
    expect(result).toBe('https://api.example.com/testkey/users')
  })

  it('should work with DefLlama Pro API example', () => {
    const result = injectApiKeyInPath('https://pro-api.defillama.com', 'testkey', '/coins/latest')
    expect(result).toBe('https://pro-api.defillama.com/testkey/coins/latest')
  })

  it('should handle complex API keys', () => {
    const apiKey = 'abc123:def456,ghi789'
    const result = injectApiKeyInPath('https://api.example.com', apiKey, '/data')
    expect(result).toBe('https://api.example.com/abc123%3Adef456%2Cghi789/data')
  })

  it('should handle path without leading slash', () => {
    const result = injectApiKeyInPath('https://api.example.com', 'key', 'users')
    expect(result).toBe('https://api.example.com/key/users')
  })

  it('should handle base URL with trailing slash', () => {
    const result = injectApiKeyInPath('https://api.example.com/', 'key', '/users')
    expect(result).toBe('https://api.example.com/key/users')
  })

  it('should handle empty path', () => {
    const result = injectApiKeyInPath('https://api.example.com', 'key', '')
    expect(result).toBe('https://api.example.com/key')
  })
})

describe('mergeUrls', () => {
  it('should merge basic URLs', () => {
    const params = new URLSearchParams('token=123')
    const result = mergeUrls('https://example.com', '/api', params)
    expect(result).toBe('https://example.com/api?token=123')
  })

  it('should handle relative URLs with origin', () => {
    const params = new URLSearchParams('token=123')
    const result = mergeUrls('/api', '/users', params)
    expect(result).toContain('/api/users?token=123')
  })

  it('should handle complex query params', () => {
    const params = new URLSearchParams([
      ['filter', 'active'],
      ['sort', 'name'],
      ['tags', 'tag1'],
      ['tags', 'tag2'],
    ])
    const result = mergeUrls('https://api.example.com', '/users', params)
    expect(result).toBe('https://api.example.com/users?filter=active&sort=name&tags=tag1&tags=tag2')
  })

  it('should merge query params from base URL and path', () => {
    const params = new URLSearchParams('version=3')
    const result = mergeUrls('https://api.example.com?env=prod', '/users?type=admin', params)
    expect(result).toBe('https://api.example.com/users?env=prod&type=admin&version=3')
  })

  it('should return empty string for empty inputs', () => {
    expect(mergeUrls('', '')).toBe('')
  })

  it('should handle path-only when URL is empty', () => {
    expect(mergeUrls('', '/api/users')).toBe('/api/users')
  })

  it('should handle URL without query params', () => {
    const result = mergeUrls('https://api.example.com', '/users')
    expect(result).toBe('https://api.example.com/users')
  })

  describe('API key injection', () => {
    it('should inject API key when required', () => {
      const params = new URLSearchParams('token=123')
      const result = mergeUrls('https://pro-api.example.com', '/coins/latest', params, false, 'testkey', true)
      expect(result).toBe('https://pro-api.example.com/testkey/coins/latest?token=123')
    })

    it('should not inject API key when not required', () => {
      const params = new URLSearchParams('token=123')
      const result = mergeUrls('https://api.example.com', '/users', params, false, 'testkey', false)
      expect(result).toBe('https://api.example.com/users?token=123')
    })

    it('should handle API key with special characters', () => {
      const result = mergeUrls(
        'https://pro-api.example.com',
        '/data',
        new URLSearchParams(),
        false,
        'test:key@123',
        true,
      )
      expect(result).toBe('https://pro-api.example.com/test%3Akey%40123/data')
    })

    it('should not inject empty API key', () => {
      const result = mergeUrls('https://pro-api.example.com', '/coins', new URLSearchParams(), false, '', true)
      expect(result).toBe('https://pro-api.example.com/coins')
    })

    it('should not inject undefined API key', () => {
      const result = mergeUrls('https://pro-api.example.com', '/coins', new URLSearchParams(), false, undefined, true)
      expect(result).toBe('https://pro-api.example.com/coins')
    })

    it('should handle API key with query parameters', () => {
      const params = new URLSearchParams('limit=100')
      const result = mergeUrls('https://pro-api.example.com', '/coins?sort=price', params, false, 'mykey', true)
      expect(result).toBe('https://pro-api.example.com/mykey/coins?sort=price&limit=100')
    })

    it('should maintain backward compatibility with fewer parameters', () => {
      // 2 parameters
      expect(mergeUrls('https://api.example.com', '/users')).toBe('https://api.example.com/users')

      // 3 parameters
      const params = new URLSearchParams('filter=active')
      expect(mergeUrls('https://api.example.com', '/users', params)).toBe('https://api.example.com/users?filter=active')

      // 4 parameters
      expect(mergeUrls('https://api.example.com', '/users', params, false)).toBe(
        'https://api.example.com/users?filter=active',
      )
    })
  })
})
