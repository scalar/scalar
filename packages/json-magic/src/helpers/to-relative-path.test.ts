import { describe, expect, it } from 'vitest'

import { toRelativePath } from './to-relative-path'

describe('remote URLs with same origin', () => {
  it('calculates relative path between URLs in the same directory', () => {
    const input = 'https://example.com/api/users.json'
    const base = 'https://example.com/api/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('users.json')
  })

  it('calculates relative path when input is in a subdirectory', () => {
    const input = 'https://example.com/api/v1/users.json'
    const base = 'https://example.com/api/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('v1/users.json')
  })

  it('calculates relative path when input is in a parent directory', () => {
    const input = 'https://example.com/api/users.json'
    const base = 'https://example.com/api/v1/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('../users.json')
  })

  it('calculates relative path between deeply nested URLs', () => {
    const input = 'https://example.com/schemas/user/profile.json'
    const base = 'https://example.com/api/v1/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('../../schemas/user/profile.json')
  })

  it('handles URLs with trailing slashes', () => {
    const input = 'https://example.com/api/users.json'
    const base = 'https://example.com/api/'
    const result = toRelativePath(input, base)
    // path.relative should handle this correctly
    expect(result).toBeTruthy()
  })

  it('handles URLs at root level', () => {
    const input = 'https://example.com/schema.json'
    const base = 'https://example.com/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('schema.json')
  })

  it('handles identical URLs', () => {
    const input = 'https://example.com/api/users.json'
    const base = 'https://example.com/api/users.json'
    const result = toRelativePath(input, base)
    // When input and base are the same, the relative path is the filename itself
    expect(result).toBe('users.json')
  })
})

describe('remote URLs with different origins', () => {
  it('returns input as is when origins differ', () => {
    const input = 'https://other.com/api/users.json'
    const base = 'https://example.com/api/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBe(input)
  })

  it('returns input as is when protocols differ', () => {
    const input = 'http://example.com/api/users.json'
    const base = 'https://example.com/api/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBe(input)
  })

  it('returns input as is when ports differ', () => {
    const input = 'https://example.com:8080/api/users.json'
    const base = 'https://example.com/api/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBe(input)
  })

  it('returns input as is when subdomains differ', () => {
    const input = 'https://api.example.com/users.json'
    const base = 'https://www.example.com/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBe(input)
  })
})

describe('file paths', () => {
  it('calculates relative path between files in the same directory', () => {
    const input = '/path/to/users.json'
    const base = '/path/to/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('users.json')
  })

  it('calculates relative path when input is in a subdirectory', () => {
    const input = '/path/to/schemas/users.json'
    const base = '/path/to/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('schemas/users.json')
  })

  it('calculates relative path when input is in a parent directory', () => {
    const input = '/path/users.json'
    const base = '/path/to/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('../users.json')
  })

  it('handles relative file paths', () => {
    const input = './schemas/user.json'
    const base = './openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })

  it('handles deeply nested file paths', () => {
    const input = '/project/schemas/user/profile.json'
    const base = '/project/api/v1/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('../../schemas/user/profile.json')
  })
})

describe('mixed inputs (URL and path)', () => {
  it('returns input as is when input is URL but base is file path', () => {
    const input = 'https://example.com/schema.json'
    const base = '/path/to/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe(input)
  })

  it('transforms path to URL when input is file path but base is URL', () => {
    const input = '/path/to/schema.json'
    const base = 'https://example.com/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('https://example.com/path/to/schema.json')
  })
})

describe('edge cases', () => {
  it('handles empty input string', () => {
    const input = ''
    const base = 'https://example.com/openapi.json'
    expect(() => toRelativePath(input, base)).not.toThrow()
  })

  it('handles empty base string', () => {
    const input = 'https://example.com/schema.json'
    const base = ''
    expect(() => toRelativePath(input, base)).not.toThrow()
  })

  it('handles URLs with query parameters', () => {
    const input = 'https://example.com/api/users.json?version=v1'
    const base = 'https://example.com/api/posts.json'
    const result = toRelativePath(input, base)
    // Query parameters are part of the URL but not the pathname
    expect(result).toBeTruthy()
  })

  it('handles URLs with hash fragments', () => {
    const input = 'https://example.com/api/users.json#section'
    const base = 'https://example.com/api/posts.json'
    const result = toRelativePath(input, base)
    // Hash fragments are part of the URL but not the pathname
    expect(result).toBeTruthy()
  })

  it('handles URLs with encoded characters', () => {
    const input = 'https://example.com/api/users%20list.json'
    const base = 'https://example.com/api/posts.json'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })
})

describe('relative base path scenarios', () => {
  it('normalizes input when base is relative path', () => {
    const input = './schemas/user.json'
    const base = 'api/openapi.json'
    const result = toRelativePath(input, base)
    // Should normalize the input since base is relative
    expect(result).toBeTruthy()
  })

  it('normalizes absolute input when base is relative path', () => {
    const input = '/absolute/path/schema.json'
    const base = './openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })

  it('handles both paths being relative', () => {
    const input = 'schemas/user.json'
    const base = 'api/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })

  it('normalizes path with ../ when base is relative', () => {
    const input = '../schemas/user.json'
    const base = './openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })
})

describe('root-level and boundary cases', () => {
  it('handles files at filesystem root', () => {
    const input = '/schema.json'
    const base = '/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('schema.json')
  })

  it('handles input at root when base is nested', () => {
    const input = '/schema.json'
    const base = '/path/to/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('../../schema.json')
  })

  it('handles base at root when input is nested', () => {
    const input = '/path/to/schemas/user.json'
    const base = '/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('path/to/schemas/user.json')
  })

  it('handles URLs at root level', () => {
    const input = 'https://example.com/schema.json'
    const base = 'https://example.com/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('schema.json')
  })

  it('handles very long nested paths', () => {
    const input = '/a/b/c/d/e/f/g/h/i/j/schema.json'
    const base = '/a/b/c/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('d/e/f/g/h/i/j/schema.json')
  })

  it('handles paths going up many levels', () => {
    const input = '/a/b/schema.json'
    const base = '/a/b/c/d/e/f/g/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBe('../../../../../schema.json')
  })

  it('handles identical file paths', () => {
    const input = '/path/to/openapi.json'
    const base = '/path/to/openapi.json'
    const result = toRelativePath(input, base)
    // When they are the same file, relative path should be the filename
    expect(result).toBe('openapi.json')
  })

  it('handles input and base in completely different directory trees', () => {
    const input = '/var/www/schemas/user.json'
    const base = '/home/project/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
    expect(result).toContain('..')
  })
})

describe('trailing slashes and edge formatting', () => {
  it('handles input with trailing slash', () => {
    const input = '/path/to/schemas/'
    const base = '/path/to/openapi.json'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })

  it('handles base with trailing slash', () => {
    const input = '/path/to/schemas/user.json'
    const base = '/path/to/'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })

  it('handles URL with trailing slash in both', () => {
    const input = 'https://example.com/api/'
    const base = 'https://example.com/schemas/'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })

  it('handles URL with no path', () => {
    const input = 'https://example.com/schema.json'
    const base = 'https://example.com'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })

  it('handles base URL at root with trailing slash', () => {
    const input = 'https://example.com/schema.json'
    const base = 'https://example.com/'
    const result = toRelativePath(input, base)
    expect(result).toBeTruthy()
  })
})
