import { describe, expect, it } from 'vitest'

import { REGEX } from './regex-helpers'

describe('protocolRegex', () => {
  it('allows http://', () => {
    const text = 'http://example.com'
    expect(text.match(REGEX.PROTOCOL)).toBeTruthy()
  })

  it('allows https://', () => {
    const text = 'https://example.com'
    expect(text.match(REGEX.PROTOCOL)).toBeTruthy()
  })

  it('allows file://', () => {
    const text = 'file://example.com'
    expect(text.match(REGEX.PROTOCOL)).toBeTruthy()
  })

  it('allows ftp://', () => {
    const text = 'ftp://example.com'
    expect(text.match(REGEX.PROTOCOL)).toBeTruthy()
  })

  it('allows mailto://', () => {
    const text = 'mailto://example.com'
    expect(text.match(REGEX.PROTOCOL)).toBeTruthy()
  })

  it('does not allow variables before ://', () => {
    const text = '{protocol}://example.com'
    expect(text.match(REGEX.PROTOCOL)).toBeNull()
  })

  it('does not allow no protocol with a variable', () => {
    const text = '{base}/api'
    expect(text.match(REGEX.PROTOCOL)).toBeNull()
  })

  it('does not allow no protocol with no variables', () => {
    const text = 'example.com'
    expect(text.match(REGEX.PROTOCOL)).toBeNull()
  })
})

describe('multipleSlashesRegex', () => {
  it('matches multiple slashes', () => {
    const text = 'http://example.com//api'.replace(REGEX.MULTIPLE_SLASHES, '/')
    expect(text).toBe('http://example.com/api')
  })

  it('matches multiple slashes in the path', () => {
    const text = 'http://example.com/api//users////{id}'.replace(REGEX.MULTIPLE_SLASHES, '/')
    expect(text).toBe('http://example.com/api/users/{id}')
  })

  it('does not match single slash or the scheme', () => {
    const text = 'http://example.com/api/users/{id}'
    expect(text.match(REGEX.MULTIPLE_SLASHES)).toBeNull()
  })

  it('does not do anything to the query params', () => {
    const text = 'http://example.com/api/users/{id}?query=param'
    expect(text.replace(REGEX.MULTIPLE_SLASHES, '/')).toBe('http://example.com/api/users/{id}?query=param')
  })
})

describe('variableRegex', () => {
  it('matches variables with double curly braces', () => {
    const text = '{{example.com}}'
    const matches = [...text.matchAll(REGEX.VARIABLES)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe('example.com')
  })

  it('matches variables with nested curly braces', () => {
    const text = '{{example.com:{port}}}'
    const matches = [...text.matchAll(REGEX.VARIABLES)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe('example.com:{port}')
  })

  it('matches multiple variables', () => {
    const text = '{{{host}.example.com:{port}}}'
    const matches = [...text.matchAll(REGEX.VARIABLES)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe('{host}.example.com:{port}')
  })

  it('does not match single curly braces', () => {
    const text = '{example.com}'
    const matches = [...text.matchAll(REGEX.VARIABLES)]
    expect(matches.length).toBe(0)
  })

  it('does not match unbalanced curly braces', () => {
    const text = '{{example.com}'
    const matches = [...text.matchAll(REGEX.VARIABLES)]
    expect(matches.length).toBe(0)
  })

  it('matches variables with whitespace', () => {
    const text = '{{ example.com }}'
    const matches = [...text.matchAll(REGEX.VARIABLES)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe(' example.com ')
  })

  it('matches variables in longer text', () => {
    const text = 'prefix {{variable}} suffix'
    const matches = [...text.matchAll(REGEX.VARIABLES)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe('variable')
  })

  it('matches multiple separate variables', () => {
    const text = '{{first}} middle {{second}}'
    const matches = [...text.matchAll(REGEX.VARIABLES)]
    expect(matches.length).toBe(2)
    expect(matches[0]![1]).toBe('first')
    expect(matches[1]![1]).toBe('second')
  })
})

describe('pathRegex', () => {
  it('matches path parameters', () => {
    const text = '/users/{id}'
    const matches = [...text.matchAll(REGEX.PATH)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe('id')
  })

  it('matches multiple path parameters', () => {
    const text = '/users/{userId}/posts/{postId}'
    const matches = [...text.matchAll(REGEX.PATH)]
    expect(matches.length).toBe(2)
    expect(matches[0]![1]).toBe('userId')
    expect(matches[1]![1]).toBe('postId')
  })

  it('does not match double curly braces', () => {
    const text = '/users/{{id}}'
    const matches = [...text.matchAll(REGEX.PATH)]
    expect(matches.length).toBe(0)
  })

  it('matches path parameters with dots', () => {
    const text = '/api/{version}/users'
    const matches = [...text.matchAll(REGEX.PATH)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe('version')
  })

  it('matches path parameters with hyphens and underscores', () => {
    const text = '/users/{user-id}/posts/{post_id}'
    const matches = [...text.matchAll(REGEX.PATH)]
    expect(matches.length).toBe(2)
    expect(matches[0]![1]).toBe('user-id')
    expect(matches[1]![1]).toBe('post_id')
  })

  it('does not match nested curly braces', () => {
    const text = '/users/{outer{inner}}'
    const matches = [...text.matchAll(REGEX.PATH)]
    expect(matches.length).toBe(0)
  })

  it('matches path parameters at start of string', () => {
    const text = '{version}/api'
    const matches = [...text.matchAll(REGEX.PATH)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe('version')
  })

  it('matches path parameters at end of string', () => {
    const text = '/api/{version}'
    const matches = [...text.matchAll(REGEX.PATH)]
    expect(matches.length).toBe(1)
    expect(matches[0]![1]).toBe('version')
  })
})
