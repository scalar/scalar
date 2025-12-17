import { describe, expect, it } from 'vitest'

import { extractPathFromUrl, extractPathParameterNames, getDomainFromUrl, normalizePath } from './urls'

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
})
